// Test script to change project status
import fetch from 'node-fetch';

let cookies = '';

async function login() {
  console.log('Logging in...');
  
  const credentials = [
    { email: 'john.doe@bni.co.id', password: 'password123' },
    { email: 'admin@bni.co.id', password: 'admin123' }
  ];
  
  for (const cred of credentials) {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cred)
    });
    
    if (response.ok) {
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        cookies = setCookie;
      }
      const result = await response.json();
      console.log('Login success:', result.user.email);
      return true;
    }
  }
  
  return false;
}

async function testChangeStatus() {
  try {
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('Login failed');
      return;
    }
    
    console.log('\nGetting projects...');
    
    const projectsResponse = await fetch('http://localhost:5000/api/projects', {
      headers: {
        'Cookie': cookies
      }
    });
    
    const projects = await projectsResponse.json();
    console.log('Found projects:', projects.length);
    
    if (projects.length === 0) {
      console.error('No projects found');
      return;
    }
    
    const project = projects[0];
    console.log('Using project:', project.title, project.id);
    console.log('Current status:', project.status);
    
    // Change status
    const newStatus = 'Demand Prioritized';
    console.log('\nChanging status to:', newStatus);
    
    const response = await fetch(`http://localhost:5000/api/projects/${project.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        status: newStatus
      })
    });
    
    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response body:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS: Status changed!');
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

testChangeStatus();
