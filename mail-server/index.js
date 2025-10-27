import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
import crypto from "crypto";
import { eq } from "drizzle-orm";
dotenv.config();
import { db } from "./db/db.js";
import { 
  physicalMessages, 
  messageHeaders, 
  messageBodies, 
  messageRecipients,
  attachments,
  threads
} from "./db/schema.js";

// Helper function to normalize subject for threading
function normalizeSubject(subject) {
  if (!subject) return null;
  // Remove Re:, Fwd:, etc. and trim
  return subject
    .replace(/^(re|fwd|fw):\s*/gi, '')
    .trim()
    .substring(0, 998);
}

// Helper function to generate message hash
function generateMessageHash(from, subject, date) {
  const hashInput = `${from}-${subject}-${date}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

const server = new SMTPServer({
  authOptional: true,
  onData(stream, session, callback) {
    simpleParser(stream)
      .then(async parsed => {
        try {
          // Generate message hash
          const messageHash = generateMessageHash(
            parsed.from?.text || '',
            parsed.subject || '',
            parsed.date?.toISOString() || new Date().toISOString()
          );

          // Normalize subject for threading
          const normalizedSubject = normalizeSubject(parsed.subject);

          // Find or create thread
          let threadId = null;
          if (normalizedSubject) {
            const existingThread = await db
              .select()
              .from(threads)
              .where(eq(threads.normalizedSubject, normalizedSubject))
              .limit(1);

            if (existingThread.length > 0) {
              threadId = existingThread[0].threadId;
              // Update thread timestamp
              await db
                .update(threads)
                .set({ updatedAt: new Date() })
                .where(eq(threads.threadId, threadId));
            } else {
              // Create new thread
              const [newThread] = await db
                .insert(threads)
                .values({
                  normalizedSubject,
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
                .returning();
              threadId = newThread.threadId;
            }
          }

          // Insert physical message
          const [physicalMessage] = await db
            .insert(physicalMessages)
            .values({
              rawSourceKey: `raw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              messageHash,
              subject: parsed.subject?.substring(0, 998) || null,
              receivedAt: parsed.date || new Date(),
              threadId
            })
            .returning();

          console.log(`✅ Saved physical message ID: ${physicalMessage.physicalMessageId}`);

          // Insert message headers
          if (parsed.headers) {
            const headerEntries = [];
            for (const [name, value] of parsed.headers) {
              headerEntries.push({
                physicalMessageId: physicalMessage.physicalMessageId,
                headerName: name,
                headerValue: Array.isArray(value) ? value.join(', ') : value.toString()
              });
            }
            if (headerEntries.length > 0) {
              await db.insert(messageHeaders).values(headerEntries);
            }
          }

          // Insert message body
          await db.insert(messageBodies).values({
            physicalMessageId: physicalMessage.physicalMessageId,
            bodyText: parsed.text || null,
            bodyHtmlKey: parsed.html ? `html_${physicalMessage.physicalMessageId}` : null
          });

          // Insert recipients
          const recipients = [];
          
          if (parsed.to) {
            const toAddresses = Array.isArray(parsed.to) ? parsed.to : [parsed.to];
            toAddresses.forEach(addr => {
              recipients.push({
                physicalMessageId: physicalMessage.physicalMessageId,
                recipientEmail: addr.address,
                recipientName: addr.name || null,
                recipientType: 'to'
              });
            });
          }

          if (parsed.cc) {
            const ccAddresses = Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc];
            ccAddresses.forEach(addr => {
              recipients.push({
                physicalMessageId: physicalMessage.physicalMessageId,
                recipientEmail: addr.address,
                recipientName: addr.name || null,
                recipientType: 'cc'
              });
            });
          }

          if (recipients.length > 0) {
            await db.insert(messageRecipients).values(recipients);
          }

          // Insert attachments
          if (parsed.attachments && parsed.attachments.length > 0) {
            const attachmentEntries = parsed.attachments.map(att => ({
              physicalMessageId: physicalMessage.physicalMessageId,
              filename: att.filename || 'unnamed',
              mimeType: att.contentType || 'application/octet-stream',
              fileSizeBytes: BigInt(att.size || 0),
              storageKey: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }));
            await db.insert(attachments).values(attachmentEntries);
          }

          console.log(`📧 Email processed successfully`);
          console.log(`   From: ${parsed.from?.text}`);
          console.log(`   To: ${parsed.to?.text}`);
          console.log(`   Subject: ${parsed.subject}`);
          
          callback();
        } catch (err) {
          console.error("❌ Error saving email to database:", err);
          callback(err);
        }
      })
      .catch(err => {
        console.error("❌ Error parsing email:", err);
        callback(err);
      });
  }
});

server.listen(process.env.PORT || 2525, () => {
  console.log(`🚀 SMTP Server running on port ${process.env.PORT || 2525}`);
});