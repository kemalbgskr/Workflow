// Test script to configure project approvers with login
const fetch = require('node-fetch');

// Store cookies
let cookies = '';

async function login() {
  console.log('Logging in...');
  
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@bni.co.id',
      password: 'admin123'
    })
  });
  
  // Get cookies from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    cookies = setCookie;
  }
  
  const result = await response.json();
  console.log('Login result:', result);
  
  return response.ok;
}

async function testConfigureProjectApprovers() {
  try {
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('Login failed');
      return;
    }
    
    console.log('\nTesting configure project approvers...');
    
    // Get all users
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (!usersResponse.ok) {
      console.error('Failed to fetch users:', usersResponse.status);
      return;
    }
    
    const users = await usersResponse.json();
    console.log('Found users:', users.length);
    
    const approver = users.find(u => u.role === 'APPROVER' || u.role === 'ADMIN');
    if (!approver) {
      console.error('No approver found');
      return;
    }
    
    console.log('Using approver:', approver.name, approver.email);
    
    // Get all projects
    const projectsResponse = await fetch('http://localhost:5000/api/projects', {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (!projectsResponse.ok) {
      console.error('Failed to fetch projects:', projectsResponse.status);
      return;
    }
    
    const projects = await projectsResponse.json();
    console.log('Found projects:', projects.length);
    
    if (projects.length === 0) {
      console.error('No projects found');
      return;
    }
    
    const project = projects[0];
    console.log('Using project:', project.title, project.id);
    
    // Configure approvers
    console.log('\nConfiguring approvers...');
    const response = await fetch(`http://localhost:5000/api/projects/${project.id}/approvers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        approverIds: [approver.id],
        mode: 'SEQUENTIAL',
        priority: 'MEDIUM'
      })
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: Project approvers configured!');
    } else {
      console.error('\n❌ FAILED:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testConfigureProjectApprovers();
