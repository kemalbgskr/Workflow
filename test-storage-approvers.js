// Test storage langsung untuk project approvers
import { storage } from './server/storage.js';

async function testStorageApprovers() {
  try {
    console.log('Testing storage.getProjectApprovers...');
    
    const projectId = 'd54de9e3-6734-4794-a605-d25c9ef132d4';
    console.log('Project ID:', projectId);
    
    const approvers = await storage.getProjectApprovers(projectId);
    console.log('Result:', approvers);
    console.log('Length:', approvers.length);
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testStorageApprovers();