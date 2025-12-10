import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("REQUESTER"),
  department: text("department"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  category: text("category"),
  methodology: text("methodology").notNull(),
  status: text("status").notNull().default("Initiative Submitted"),
  priority: text("priority").notNull().default("MEDIUM"),
  teamMembers: text("team_members").array(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  filename: text("filename").notNull(),
  storageKey: text("storage_key").notNull(),
  lifecycleStep: text("lifecycle_step"),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("DRAFT"), // DRAFT, IN_REVIEW, APPROVED, REJECTED, DELETED
  priority: text("priority").notNull().default("MEDIUM"),
  createdById: uuid("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const approvalRounds = pgTable("approval_rounds", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  mode: text("mode").notNull().default("SEQUENTIAL"),
  orderIndex: integer("order_index").notNull().default(0),
  status: text("status").notNull().default("PENDING"),
  priority: text("priority").notNull().default("MEDIUM"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const approvers = pgTable("approvers", {
  id: uuid("id").primaryKey().defaultRandom(),
  roundId: uuid("round_id").notNull().references(() => approvalRounds.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  email: text("email").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  mustSign: boolean("must_sign").notNull().default(true),
  status: text("status").notNull().default("PENDING"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const signatureEnvelopes = pgTable("signature_envelopes", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  docusealTemplateId: text("docuseal_template_id"),
  docusealSubmissionId: text("docuseal_submission_id"),
  docusealEnvelopeId: text("docuseal_envelope_id"),
  docusealUrl: text("docuseal_url"),
  docusealEditUrl: text("docuseal_edit_url"),
  status: text("status").notNull().default("CREATED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  attachmentPath: text("attachment_path"),
  attachmentName: text("attachment_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const statusHistory = pgTable("status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorId: uuid("actor_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider").notNull().default("docuseal"),
  eventType: text("event_type").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull().default("PENDING"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectStatusRequests = pgTable("project_status_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  priority: text("priority").notNull().default("MEDIUM"),
  requestedBy: uuid("requested_by").notNull().references(() => users.id),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const projectApprovers = pgTable("project_approvers", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  mode: text("mode").notNull().default("SEQUENTIAL"),
  priority: text("priority").notNull().default("MEDIUM"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const projectStatusApprovals = pgTable("project_status_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => projectStatusRequests.id, { onDelete: "cascade" }),
  approverId: uuid("approver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("PENDING"),
  comment: text("comment"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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

