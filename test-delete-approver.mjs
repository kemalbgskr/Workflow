import fetch from 'node-fetch';

let cookies = '';

async function login() {
  const credentials = [
    { email: 'john.doe@bni.co.id', password: 'password123' },
    { email: 'admin@bni.co.id', password: 'admin123' }
  ];
  
  for (const cred of credentials) {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cred)
    });
    
    if (response.ok) {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookies = setCookie;
      const result = await response.json();
      console.log('Login success:', result.user.email, 'Role:', result.user.role);
      return true;
    }
  }
  return false;
}

async function testDeleteApprover() {
  try {
    if (!await login()) {
      console.error('Login failed');
      return;
    }
    
    // Get projects
    const projectsResponse = await fetch('http://localhost:5000/api/projects', {
      headers: { 'Cookie': cookies }
    });
    const projects = await projectsResponse.json();
    
    if (projects.length === 0) {
      console.error('No projects found');
      return;
    }
    
    const project = projects[0];
    console.log('\nProject:', project.title, project.id);
    
    // Get approvers
    const approversResponse = await fetch(`http://localhost:5000/api/projects/${project.id}/approvers`, {
      headers: { 'Cookie': cookies }
    });
    const approvers = await approversResponse.json();
    
    console.log('Approvers:', approvers.length);
    
    if (approvers.length === 0) {
      console.log('No approvers to delete');
      return;
    }
    
    const approver = approvers[0];
    console.log('\nDeleting approver:', approver.email, approver.id);
    
    // Delete approver
    const response = await fetch(`http://localhost:5000/api/projects/${project.id}/approvers/${approver.id}`, {
      method: 'DELETE',
      headers: { 'Cookie': cookies }
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response text:', text.substring(0, 200));
    
    let result;
    try {
      result = JSON.parse(text);
      console.log('Response:', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('Not JSON response');
    }
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: Approver deleted!');
    } else {
      console.error('\n❌ FAILED:', result.error);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testDeleteApprover();
