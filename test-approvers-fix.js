import fetch from 'node-fetch';

async function testApproversEndpoint() {
  try {
    console.log('Testing approvers endpoint...');
    
    // First login to get session
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'john.doe@bni.co.id',
        password: 'password'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Login successful, got cookies');
    
    // Get users to find approver IDs
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (!usersResponse.ok) {
      console.error('Failed to get users:', await usersResponse.text());
      return;
    }
    
    const users = await usersResponse.json();
    console.log('Available users:', users.map(u => ({ id: u.id, name: u.name, role: u.role })));
    
    const approvers = users.filter(u => u.role === 'APPROVER' || u.role === 'ADMIN');
    console.log('Found approvers:', approvers.map(u => ({ id: u.id, name: u.name })));
    
    if (approvers.length === 0) {
      console.error('No approvers found');
      return;
    }
    
    // Test the approvers endpoint
    const documentId = '65e8c2b9-af91-4e49-9689-28721f6f09fb';
    const requestBody = {
      approvers: [approvers[0].id], // Use first approver
      approvalMode: 'SEQUENTIAL',
      priority: 'MEDIUM',
      approvalSteps: [{
        userId: approvers[0].id,
        order: 1
      }],
      useDocuSeal: false
    };
    
    console.log('Sending request to configure approvers...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`http://localhost:5000/api/documents/${documentId}/approvers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Success! Approvers configured successfully');
    } else {
      console.log('❌ Failed to configure approvers');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testApproversEndpoint();