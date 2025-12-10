// Test database untuk project approvers
import { db } from './server/db.js';
import { projects, users, projectApprovers } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testDatabaseApprovers() {
  try {
    console.log('Testing database project approvers...');
    
    // 1. Get first project
    const projectList = await db.select().from(projects).limit(1);
    if (projectList.length === 0) {
      console.log('No projects found');
      return;
    }
    
    const project = projectList[0];
    console.log('Project:', project.title, project.id);
    
    // 2. Get approver users
    const userList = await db.select().from(users);
    const approvers = userList.filter(u => u.role === 'APPROVER' || u.role === 'ADMIN');
    console.log('Available approvers:', approvers.length);
    
    if (approvers.length === 0) {
      console.log('No approvers found');
      return;
    }
    
    // 3. Insert test approvers directly to database
    console.log('Inserting test approvers...');
    const testApprovers = approvers.slice(0, 2).map((user, index) => ({
      projectId: project.id,
      userId: user.id,
      email: user.email,
      orderIndex: index,
      mode: 'SEQUENTIAL'
    }));
    
    // Delete existing first
    await db.delete(projectApprovers).where(eq(projectApprovers.projectId, project.id));
    
    // Insert new
    await db.insert(projectApprovers).values(testApprovers);
    console.log('✅ Test approvers inserted');
    
    // 4. Query back
    const result = await db.select({
      id: projectApprovers.id,
      userId: projectApprovers.userId,
      email: projectApprovers.email,
      orderIndex: projectApprovers.orderIndex,
      mode: projectApprovers.mode,
      userName: users.name,
      userDepartment: users.department
    })
    .from(projectApprovers)
    .leftJoin(users, eq(projectApprovers.userId, users.id))
    .where(eq(projectApprovers.projectId, project.id));
    
    console.log('✅ Query result:', result.length, 'approvers');
    console.log('Approvers:', result);
    
    console.log('\n✅ Database test completed successfully!');
    console.log('Now try accessing the frontend to see if approvers show up.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabaseApprovers();