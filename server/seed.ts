import { db } from './db';
import { users, projects, documents, approvers, approvalRounds, comments, auditLogs, projectStatusRequests, projectStatusApprovals, projectApprovers, signatureEnvelopes, statusHistory, webhookEvents } from '@shared/schema';

export async function seedDatabase() {
  console.log('🌱 Seeding database with dummy data...');

  try {
    console.log('🗑️ Clearing existing data...');
    await db.delete(projectStatusApprovals);
    await db.delete(projectStatusRequests);
    await db.delete(projectApprovers);
    await db.delete(signatureEnvelopes);
    await db.delete(auditLogs);
    await db.delete(statusHistory);
    await db.delete(webhookEvents);
    await db.delete(comments);
    await db.delete(approvers);
    await db.delete(approvalRounds);
    await db.delete(documents);
    await db.delete(projects);
    await db.delete(users);
    console.log('✅ Data cleared.');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    // Don't stop if clearing fails, tables might not exist yet
  }

  let seedUsers: any[] = [];
  try {
    console.log('👤 Seeding users...');
    seedUsers = await db.insert(users).values([
      {
        name: "John Doe",
        email: "john.doe@bni.co.id",
        password: "password123", // In a real app, this should be hashed
        role: "REQUESTER",
        department: "IT - PMO"
      },
      {
        name: "Jane Smith",
        email: "jane.smith@bni.co.id",
        password: "password123",
        role: "APPROVER",
        department: "IT - Development"
      },
      {
        name: "Mike Johnson",
        email: "mike.johnson@bni.co.id",
        password: "password123",
        role: "ADMIN",
        department: "IT - Security"
      },
      {
        name: "Sarah Wilson",
        email: "sarah.wilson@bni.co.id",
        password: "password123",
        role: "APPROVER",
        department: "Business Analysis"
      },
      {
        name: "David Chen",
        email: "david.chen@bni.co.id",
        password: "password123",
        role: "REQUESTER",
        department: "Digital Banking"
      }
    ]).returning();
    console.log(`✅ Created ${seedUsers.length} users`);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }

  let seedProjects: any[] = [];
  try {
    console.log('🏗️ Seeding projects...');
    seedProjects = await db.insert(projects).values([
      {
        code: "PRJ-2024-001",
        title: "Core Banking System Upgrade",
        type: "Project",
        category: "Infrastructure",
        methodology: "Waterfall",
        status: "Kick Off",
        ownerId: seedUsers[0].id
      },
      {
        code: "PRJ-2024-002",
        title: "Mobile App Enhancement",
        type: "Project",
        category: "Application",
        methodology: "Agile",
        status: "ARF",
        ownerId: seedUsers[1].id
      },
      {
        code: "NP-2024-015",
        title: "Security Audit Q1",
        type: "Non-Project",
        category: "Security",
        methodology: "Agile",
        status: "Go Live",
        ownerId: seedUsers[2].id
      },
      {
        code: "PRJ-2024-003",
        title: "Data Migration Project",
        type: "Project",
        category: "Data",
        methodology: "Waterfall",
        status: "Deployment",
        ownerId: seedUsers[0].id
      },
      {
        code: "PRJ-2024-004",
        title: "API Gateway Implementation",
        type: "Project",
        category: "Infrastructure",
        methodology: "Agile",
        status: "Initiative Approved",
        ownerId: seedUsers[4].id
      }
    ]).returning();
    console.log(`✅ Created ${seedProjects.length} projects`);
  } catch (error) {
    console.error('❌ Error seeding projects:', error);
    process.exit(1);
  }

  let seedDocuments: any[] = [];
  try {
    console.log('📄 Seeding documents...');
    seedDocuments = await db.insert(documents).values([
      {
        projectId: seedProjects[0].id,
        filename: "Feasibility_Study_v3.pdf",
        storageKey: "uploads/sample.pdf",
        type: "FS",
        lifecycleStep: "Initiative Submitted",
        version: 3,
        status: "SIGNED",
        createdById: seedUsers[0].id
      },
      {
        projectId: seedProjects[1].id,
        filename: "Business_Requirements_v2.pdf",
        storageKey: "uploads/sample.pdf",
        type: "BRD",
        lifecycleStep: "Demand Prioritized",
        version: 2,
        status: "SIGNING",
        createdById: seedUsers[1].id
      },
      {
        projectId: seedProjects[2].id,
        filename: "Project_Charter_Draft.pdf",
        storageKey: "uploads/sample.pdf",
        type: "PROJECT_CHARTER",
        lifecycleStep: "Initiative Approved",
        version: 1,
        status: "DRAFT",
        createdById: seedUsers[2].id
      },
      {
        projectId: seedProjects[3].id,
        filename: "ARF_Form_v2.pdf",
        storageKey: "uploads/sample.pdf",
        type: "ARF",
        lifecycleStep: "ARF",
        version: 2,
        status: "IN_REVIEW",
        createdById: seedUsers[3].id
      },
      {
        projectId: seedProjects[4].id,
        filename: "Functional_Spec_v1.pdf",
        storageKey: "uploads/sample.pdf",
        type: "FSD",
        lifecycleStep: "Kick Off",
        version: 1,
        status: "DRAFT",
        createdById: seedUsers[4].id
      }
    ]).returning();
    console.log(`✅ Created ${seedDocuments.length} documents`);
  } catch (error) {
    console.error('❌ Error seeding documents:', error);
    process.exit(1);
  }

  // Skip approval rounds for now
  console.log('🔄 Skipping approval rounds - documents ready for configuration');

  console.log('🎉 Database seeded successfully!');
}

seedDatabase().catch(err => {
  console.error("A critical error occurred during seeding:", err);
  process.exit(1);
});