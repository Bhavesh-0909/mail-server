import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
dotenv.config();
import { db } from "./db/db.js";
import { emails } from "./db/schema.js"; // Add this import

const server = new SMTPServer({
  onData(stream, session, callback) {
    simpleParser(stream)
      .then(parsed => {
        
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
