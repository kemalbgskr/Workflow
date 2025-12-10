// Test script to configure project approvers
async function testConfigureProjectApprovers() {
  try {
    console.log('Testing configure project approvers...');
    
    // First, get all users to find an approver
    const usersResponse = await fetch('http://localhost:5000/api/users', {
      credentials: 'include'
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
      credentials: 'include'
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
    const response = await fetch(`http://localhost:5000/api/projects/${project.id}/approvers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
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
      console.log('✅ SUCCESS: Project approvers configured!');
    } else {
      console.error('❌ FAILED:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  }
}

testConfigureProjectApprovers();
