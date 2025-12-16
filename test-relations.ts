import { db } from './server/db';
import { users, projects, documents, projectApprovers, projectStatusRequests } from './shared/schema';
import { sql } from 'drizzle-orm';

async function testRelations() {
  console.log('🔍 Testing Database Relations...\n');

  try {
    // Test 1: Check if users table exists and has data
    console.log('1️⃣ Testing Users table...');
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log(`   ✅ Users count: ${userCount[0].count}`);

    // Test 2: Check projects and their owner relation
    console.log('\n2️⃣ Testing Projects table and owner relation...');
    const projectCount = await db.select({ count: sql<number>`count(*)` }).from(projects);
    console.log(`   ✅ Projects count: ${projectCount[0].count}`);
    
    const projectsWithOwner = await db
      .select({
        projectId: projects.id,
        projectTitle: projects.title,
        ownerId: projects.ownerId,
        ownerName: users.name,
      })
      .from(projects)
      .leftJoin(users, sql`${projects.ownerId} = ${users.id}`)
      .limit(3);
    
    console.log('   Sample projects with owners:');
    projectsWithOwner.forEach(p => {
      console.log(`   - ${p.projectTitle} (Owner: ${p.ownerName || 'NULL'})`);
    });

    // Test 3: Check documents
    console.log('\n3️⃣ Testing Documents table...');
    const docCount = await db.select({ count: sql<number>`count(*)` }).from(documents);
    console.log(`   ✅ Documents count: ${docCount[0].count}`);

    // Test 4: Check project approvers relation
    console.log('\n4️⃣ Testing ProjectApprovers table...');
    const approverCount = await db.select({ count: sql<number>`count(*)` }).from(projectApprovers);
    console.log(`   ✅ Project Approvers count: ${approverCount[0].count}`);

    // Test 5: Check project status requests
    console.log('\n5️⃣ Testing ProjectStatusRequests table...');
    const requestCount = await db.select({ count: sql<number>`count(*)` }).from(projectStatusRequests);
    console.log(`   ✅ Status Requests count: ${requestCount[0].count}`);

    // Test 6: Test the problematic query - get projects for a user
    console.log('\n6️⃣ Testing getProjectsForUser logic...');
    const allUsers = await db.select().from(users);
    
    if (allUsers.length > 0) {
      const testUser = allUsers.find(u => u.role === 'REQUESTER') || allUsers[0];
      console.log(`   Testing with user: ${testUser.name} (${testUser.role})`);
      
      const userProjects = await db
        .select()
        .from(projects)
        .where(
          sql`${projects.ownerId} = ${testUser.id} OR 
              EXISTS (
                SELECT 1 FROM ${projectApprovers} 
                WHERE ${projectApprovers.projectId} = ${projects.id} 
                AND ${projectApprovers.userId} = ${testUser.id}
              )`
        );
      
      console.log(`   ✅ User can see ${userProjects.length} projects`);
      userProjects.forEach(p => {
        console.log(`      - ${p.title} (Status: ${p.status})`);
      });
    }

    console.log('\n✅ All relation tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Relation test failed:', error);
    console.error('Error details:', error);
  }
}

testRelations().catch(console.error);
