import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["REQUESTER", "APPROVER", "ADMIN"]);
export const projectTypeEnum = pgEnum("project_type", ["Project", "Non-Project"]);
export const methodologyEnum = pgEnum("methodology", ["Waterfall", "Agile"]);
export const projectStatusEnum = pgEnum("project_status", [
  "Initiative Submitted",
  "Demand Prioritized",
  "Initiative Approved",
  "Kick Off",
  "ARF",
  "Deployment Preparation",
  "RCB",
  "Deployment",
  "PTR",
  "Go Live"
]);
export const documentTypeEnum = pgEnum("document_type", ["FS", "BRD", "PROJECT_CHARTER", "ARF", "FSD"]);
export const documentStatusEnum = pgEnum("document_status", ["DRAFT", "IN_REVIEW", "SIGNING", "SIGNED", "REJECTED"]);
export const approvalModeEnum = pgEnum("approval_mode", ["SEQUENTIAL", "PARALLEL"]);
export const approverStatusEnum = pgEnum("approver_status", ["PENDING", "SIGNED", "DECLINED"]);
export const envelopeStatusEnum = pgEnum("envelope_status", ["CREATED", "SENT", "COMPLETED", "DECLINED", "VOIDED"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("REQUESTER"),
  department: text("department"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  type: projectTypeEnum("type").notNull(),
  category: text("category"),
  methodology: methodologyEnum("methodology").notNull(),
  status: projectStatusEnum("status").notNull().default("Initiative Submitted"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull(),
  filename: text("filename").notNull(),
  storageKey: text("storage_key").notNull(),
  version: integer("version").notNull().default(1),
  status: documentStatusEnum("status").notNull().default("DRAFT"),
  createdById: varchar("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const approvalRounds = pgTable("approval_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  mode: approvalModeEnum("mode").notNull().default("SEQUENTIAL"),
  orderIndex: integer("order_index").notNull().default(0),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const approvers = pgTable("approvers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").notNull().references(() => approvalRounds.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  email: text("email").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  mustSign: boolean("must_sign").notNull().default(true),
  status: approverStatusEnum("status").notNull().default("PENDING"),
  signedAt: timestamp("signed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const signatureEnvelopes = pgTable("signature_envelopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  docusealEnvelopeId: text("docuseal_envelope_id"),
  docusealUrl: text("docuseal_url"),
  status: envelopeStatusEnum("status").notNull().default("CREATED"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const statusHistory = pgTable("status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorId: varchar("actor_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull().default("docuseal"),
  eventType: text("event_type").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull().default("PENDING"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApprovalRoundSchema = createInsertSchema(approvalRounds).omit({
  id: true,
  createdAt: true,
});

export const insertApproverSchema = createInsertSchema(approvers).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertApprovalRound = z.infer<typeof insertApprovalRoundSchema>;
export type ApprovalRound = typeof approvalRounds.$inferSelect;

export type InsertApprover = z.infer<typeof insertApproverSchema>;
export type Approver = typeof approvers.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type SignatureEnvelope = typeof signatureEnvelopes.$inferSelect;
export type StatusHistory = typeof statusHistory.$inferSelect;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
