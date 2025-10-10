import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
dotenv.config();
import { db } from "./db/db.js";

const server = new SMTPServer({
  rejectUnauthorized: false,
  authOptional: true,
  onData(stream, session, callback) {
    simpleParser(stream)
      .then(parsed => {
        const { from, to, subject, text, html } = parsed;
        db.insert("emails").values({
          from,
          to,
          subject,
          text,
          html,
        }).then(() => {
          console.log("Email saved to database");
        }).catch(err => {
          console.error("Error saving email to database:", err);
        });
      })
      .catch(err => console.error("Error parsing email:", err))
      .finally(() => callback());
  },
});

server.listen(process.env.PORT, () => {
  console.log(`🚀 SMTP Server running on port ${process.env.PORT}`);
});
