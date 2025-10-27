import { pgTable, serial, varchar, timestamp, text, integer, bigserial, bigint, boolean, date, jsonb, check, unique, foreignKey, index, primaryKey } from "drizzle-orm/pg-core";

// Section 2: Identity and Access Management
export const employees = pgTable("employees", {
  employeeId: serial("employee_id").primaryKey(),
  corporateId: varchar("corporate_id", { length: 50 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  department: varchar("department", { length: 100 }),
  jobTitle: varchar("job_title", { length: 100 }),
  hireDate: date("hire_date"),
  status: varchar("status", { length: 20 }).notNull(),
});

export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  employeeId: integer("employee_id").notNull().unique().references(() => employees.employeeId, { onDelete: "cascade" }),
  username: varchar("username", { length: 255 }).notNull().unique(),
  primaryEmail: varchar("primary_email", { length: 255 }).notNull().unique(),
  accountStatus: varchar("account_status", { length: 20 }).notNull().default("pending_setup"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userCredentials = pgTable("usercredentials", {
  userId: integer("user_id").primaryKey().references(() => users.userId, { onDelete: "cascade" }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  salt: varchar("salt", { length: 64 }).notNull(),
  hashAlgorithm: varchar("hash_algorithm", { length: 20 }).notNull(),
  hashParameters: jsonb("hash_parameters"),
  lastChangedAt: timestamp("last_changed_at").notNull().defaultNow(),
  passwordResetToken: varchar("password_reset_token", { length: 255 }).unique(),
  resetTokenExpiresAt: timestamp("reset_token_expires_at"),
});

export const userProfiles = pgTable("userprofiles", {
  userId: integer("user_id").primaryKey().references(() => users.userId, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 255 }),
  signatureHtml: text("signature_html"),
  profilePictureUrl: varchar("profile_picture_url", { length: 512 }),
});

export const userSettings = pgTable("usersettings", {
  userSettingId: serial("user_setting_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  settingName: varchar("setting_name", { length: 100 }).notNull(),
  settingValue: varchar("setting_value", { length: 512 }).notNull(),
});

// Section 4.1: Threads Table
export const threads = pgTable("threads", {
  threadId: bigserial("thread_id", { mode: "bigint" }).primaryKey(),
  normalizedSubject: varchar("normalized_subject", { length: 998 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Section 3: Email Storage
export const physicalMessages = pgTable("physicalmessages", {
  physicalMessageId: bigserial("physical_message_id", { mode: "bigint" }).primaryKey(),
  rawSourceKey: varchar("raw_source_key", { length: 512 }).notNull(),
  messageHash: varchar("message_hash", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 998 }),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  threadId: bigint("thread_id", { mode: "bigint" }).references(() => threads.threadId, { onDelete: "set null" }),
});

export const messageHeaders = pgTable("messageheaders", {
  headerId: bigserial("header_id", { mode: "bigint" }).primaryKey(),
  physicalMessageId: bigint("physical_message_id", { mode: "bigint" }).notNull().references(() => physicalMessages.physicalMessageId, { onDelete: "cascade" }),
  headerName: varchar("header_name", { length: 255 }).notNull(),
  headerValue: text("header_value").notNull(),
});

export const messageBodies = pgTable("messagebodies", {
  physicalMessageId: bigint("physical_message_id", { mode: "bigint" }).primaryKey().references(() => physicalMessages.physicalMessageId, { onDelete: "cascade" }),
  bodyText: text("body_text"),
  bodyHtmlKey: varchar("body_html_key", { length: 512 }),
});

export const attachments = pgTable("attachments", {
  attachmentId: bigserial("attachment_id", { mode: "bigint" }).primaryKey(),
  physicalMessageId: bigint("physical_message_id", { mode: "bigint" }).notNull().references(() => physicalMessages.physicalMessageId, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  fileSizeBytes: bigint("file_size_bytes", { mode: "bigint" }).notNull(),
  storageKey: varchar("storage_key", { length: 512 }).notNull(),
});

export const logicalMessages = pgTable("logicalmessages", {
  logicalMessageId: bigserial("logical_message_id", { mode: "bigint" }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  physicalMessageId: bigint("physical_message_id", { mode: "bigint" }).notNull().references(() => physicalMessages.physicalMessageId, { onDelete: "cascade" }),
  isRead: boolean("is_read").notNull().default(false),
  isStarred: boolean("is_starred").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
});

export const messageRecipients = pgTable("messagerecipients", {
  recipientId: bigserial("recipient_id", { mode: "bigint" }).primaryKey(),
  physicalMessageId: bigint("physical_message_id", { mode: "bigint" }).notNull().references(() => physicalMessages.physicalMessageId, { onDelete: "cascade" }),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientName: varchar("recipient_name", { length: 255 }),
  recipientType: varchar("recipient_type", { length: 10 }).notNull(),
});

export const folders = pgTable("folders", {
  folderId: serial("folder_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  parentFolderId: integer("parent_folder_id").references(() => folders.folderId, { onDelete: "cascade" }),
  folderName: varchar("folder_name", { length: 255 }).notNull(),
});

export const logicalMessageFolders = pgTable("logicalmessage_folders", {
  logicalMessageId: bigint("logical_message_id", { mode: "bigint" }).primaryKey().references(() => logicalMessages.logicalMessageId, { onDelete: "cascade" }),
  folderId: integer("folder_id").notNull().references(() => folders.folderId, { onDelete: "cascade" }),
});

export const labels = pgTable("labels", {
  labelId: serial("label_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.userId, { onDelete: "cascade" }),
  labelName: varchar("label_name", { length: 255 }).notNull(),
  labelColor: varchar("label_color", { length: 7 }),
});

export const logicalMessageLabels = pgTable("logicalmessage_labels", {
  logicalMessageId: bigint("logical_message_id", { mode: "bigint" }).notNull().references(() => logicalMessages.logicalMessageId, { onDelete: "cascade" }),
  labelId: integer("label_id").notNull().references(() => labels.labelId, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.logicalMessageId, table.labelId] }),
}));