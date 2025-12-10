// Simple script to clear all projects and documents via API
async function clearData() {
  try {
    console.log('Clearing all projects and documents...');
    
    // Get all projects
    const projectsResponse = await fetch('http://localhost:5000/api/projects');
    const projects = await projectsResponse.json();
    
    // Delete all projects (this should cascade delete documents)
    for (const project of projects) {
      await fetch(`http://localhost:5000/api/projects/${project.id}`, {
        method: 'DELETE'
      });
      console.log(`Deleted project: ${project.title}`);
    }
    
    console.log('All data cleared successfully!');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

clearData();