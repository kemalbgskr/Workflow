import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("REQUESTER"),
  department: text("department"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  category: text("category"),
  methodology: text("methodology").notNull(),
  status: text("status").notNull().default("Initiative Submitted"),
  priority: text("priority").notNull().default("MEDIUM"),
  teamMembers: text("team_members", { mode: "json" }).$type<string[]>(),
  ownerId: text("owner_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  filename: text("filename").notNull(),
  storageKey: text("storage_key").notNull(),
  lifecycleStep: text("lifecycle_step"),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("DRAFT"), // DRAFT, IN_REVIEW, APPROVED, REJECTED, DELETED
  priority: text("priority").notNull().default("MEDIUM"),
  createdById: text("created_by_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const approvalRounds = sqliteTable("approval_rounds", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  mode: text("mode").notNull().default("SEQUENTIAL"),
  orderIndex: integer("order_index").notNull().default(0),
  status: text("status").notNull().default("PENDING"),
  priority: text("priority").notNull().default("MEDIUM"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const approvers = sqliteTable("approvers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roundId: text("round_id").notNull().references(() => approvalRounds.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  email: text("email").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  mustSign: integer("must_sign", { mode: "boolean" }).notNull().default(1),
  status: text("status").notNull().default("PENDING"),
  signedAt: integer("signed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const signatureEnvelopes = sqliteTable("signature_envelopes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  docusealTemplateId: text("docuseal_template_id"),
  docusealSubmissionId: text("docuseal_submission_id"),
  docusealEnvelopeId: text("docuseal_envelope_id"),
  docusealUrl: text("docuseal_url"),
  docusealEditUrl: text("docuseal_edit_url"),
  status: text("status").notNull().default("CREATED"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  documentId: text("document_id").references(() => documents.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  attachmentPath: text("attachment_path"),
  attachmentName: text("attachment_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const statusHistory = sqliteTable("status_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorId: text("actor_id").references(() => users.id),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const webhookEvents = sqliteTable("webhook_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  provider: text("provider").notNull().default("docuseal"),
  eventType: text("event_type").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull().default("PENDING"),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  processedAt: integer("processed_at", { mode: "timestamp" }),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId: text("actor_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: text("metadata"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const projectStatusRequests = sqliteTable("project_status_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  priority: text("priority").notNull().default("MEDIUM"),
  requestedBy: text("requested_by").notNull().references(() => users.id),
  status: text("status").notNull().default("PENDING"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const projectApprovers = sqliteTable("project_approvers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  mode: text("mode").notNull().default("SEQUENTIAL"),
  priority: text("priority").notNull().default("MEDIUM"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const projectStatusApprovals = sqliteTable("project_status_approvals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  requestId: text("request_id").notNull().references(() => projectStatusRequests.id, { onDelete: "cascade" }),
  approverId: text("approver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("PENDING"),
  comment: text("comment"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
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

export const insertProjectRequestSchema = insertProjectSchema.omit({
  ownerId: true,
  code: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
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
export type ProjectStatusRequest = typeof projectStatusRequests.$inferSelect;
export type ProjectApprover = typeof projectApprovers.$inferSelect;
export type ProjectStatusApproval = typeof projectStatusApprovals.$inferSelect;

