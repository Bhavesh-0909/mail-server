import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
dotenv.config();
import { db } from "./db/db.js";
import { emails } from "./db/schema.js"; // Add this import

const server = new SMTPServer({
  rejectUnauthorized: false,
  authOptional: true,
  onData(stream, session, callback) {
    simpleParser(stream)
      .then(parsed => {
      
        const fromAddress = parsed.from?.value?.[0]?.address || null;
        const toAddress = parsed.to?.value?.map(v => v.address).join(", ") || null;
        const emailSubject = parsed.subject || "";
        const emailText = parsed.text || "";
        const emailHtml = parsed.html || "";

        if (!fromAddress || !toAddress) {
          console.error("Missing from/to in email headers:", parsed);
          return callback(); // skip saving malformed email
        }
        
        db.insert(emails).values({  // Change "emails" string to emails object
          from: fromAddress,
          to: toAddress,
          subject: emailSubject,
          text: emailText,
          html: emailHtml
        })
        .then(() => console.log("✅ Email saved to database"))
        .catch(err => console.error("❌ Error saving email to database:", err))
        .finally(() => callback());
      })
      .catch(err => {
        console.error("❌ Error parsing email:", err);
        callback();
      });
  }
});

server.listen(process.env.PORT, () => {
  console.log(`🚀 SMTP Server running on port ${process.env.PORT}`);
});
