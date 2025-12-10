import { storage } from './server/storage.js';

async function testConfigureApprovers() {
  try {
    console.log('Testing configureApprovers function directly...');
    
    const documentId = '65e8c2b9-af91-4e49-9689-28721f6f09fb';
    const approverIds = ['2']; // Jane Smith - APPROVER
    const approvalMode = 'SEQUENTIAL';
    
    console.log('Calling configureApprovers with:', { documentId, approverIds, approvalMode });
    
    await storage.configureApprovers(documentId, approverIds, approvalMode, [], '1', 'MEDIUM');
    
    console.log('✅ Success! configureApprovers completed without error');
    
    // Test getting approvers
    const approvers = await storage.getDocumentApprovers(documentId);
    console.log('Retrieved approvers:', approvers);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testConfigureApprovers();