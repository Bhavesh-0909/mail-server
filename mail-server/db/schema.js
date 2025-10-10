import { pgTable, serial, varchar, timestamp, text} from "drizzle-orm/pg-core";

export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  from: varchar("from", { length: 255 }).notNull(),
  to: varchar("to", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  text: text("text").notNull(),
  html: text("html").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});