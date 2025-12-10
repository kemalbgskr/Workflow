import { db } from './db';
import { users, projects } from '@shared/schema';

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test basic query
    const userCount = await db.select().from(users);
    console.log(`✅ Found ${userCount.length} users in database`);
    
    const projectCount = await db.select().from(projects);
    console.log(`✅ Found ${projectCount.length} projects in database`);
    
    console.log('🎉 Database connection successful!');
    
    if (userCount.length > 0) {
      console.log('\n📋 Sample users:');
      userCount.slice(0, 3).forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    if (projectCount.length > 0) {
      console.log('\n📋 Sample projects:');
      projectCount.slice(0, 3).forEach(project => {
        console.log(`  - ${project.code}: ${project.title} (${project.status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();