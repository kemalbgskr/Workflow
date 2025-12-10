// Quick API test script
const fetch = require('node-fetch');

async function testAPI() {
  const baseURL = 'http://localhost:5000';
  
  console.log('Testing API endpoints...\n');
  
  // Test 1: Database connection
  try {
    const res = await fetch(`${baseURL}/api/test-db`);
    const data = await res.json();
    console.log('✅ Database test:', data);
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
  }
  
  // Test 2: Get document approvers
  const documentId = '65e8c2b9-af91-4e49-9689-28721f6f09fb';
  try {
    const res = await fetch(`${baseURL}/api/documents/${documentId}/approvers`);
    const data = await res.json();
    console.log('\n✅ Document approvers:', data);
  } catch (error) {
    console.log('\n❌ Document approvers failed:', error.message);
  }
  
  // Test 3: Get approval mode
  try {
    const res = await fetch(`${baseURL}/api/documents/${documentId}/approval-mode`);
    const data = await res.json();
    console.log('\n✅ Approval mode:', data);
  } catch (error) {
    console.log('\n❌ Approval mode failed:', error.message);
  }
}

testAPI().catch(console.error);
