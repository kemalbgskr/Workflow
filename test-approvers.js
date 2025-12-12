// Test script untuk project approvers
import fetch from 'node-fetch';

async function testProjectApprovers() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // 1. Get all projects
    console.log('1. Getting all projects...');
    const projectsResponse = await fetch(`${baseUrl}/api/projects`);
    const projects = await projectsResponse.json();
    console.log('Projects:', projects.length);
    
    if (projects.length === 0) {
      console.log('No projects found');
      return;
    }
    
    const projectId = projects[0].id;
    console.log('Using project ID:', projectId);
    
    // 2. Get all users
    console.log('\n2. Getting all users...');
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    const users = await usersResponse.json();
    console.log('Users:', users.length);
    
    const approvers = users.filter(u => u.role === 'APPROVER' || u.role === 'ADMIN');
    console.log('Approvers found:', approvers.length);
    
    if (approvers.length === 0) {
      console.log('No approvers found');
      return;
    }
    
    // 3. Configure project approvers
    console.log('\n3. Configuring project approvers...');
    const approverIds = approvers.slice(0, 2).map(u => u.id); // Take first 2 approvers
    
    const configResponse = await fetch(`${baseUrl}/api/projects/${projectId}/approvers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverIds,
        mode: 'SEQUENTIAL'
      })
    });
    
    if (configResponse.ok) {
      console.log('✅ Approvers configured successfully');
    } else {
      console.log('❌ Failed to configure approvers:', configResponse.status);
      const error = await configResponse.text();
      console.log('Error:', error);
    }
    
    // 4. Get project approvers
    console.log('\n4. Getting project approvers...');
    const approversResponse = await fetch(`${baseUrl}/api/projects/${projectId}/approvers`);
    
    if (approversResponse.ok) {
      const projectApprovers = await approversResponse.json();
      console.log('✅ Project approvers retrieved:', projectApprovers.length);
      console.log('Approvers:', projectApprovers);
    } else {
      console.log('❌ Failed to get project approvers:', approversResponse.status);
      const error = await approversResponse.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testProjectApprovers();