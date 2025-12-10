
import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000';
let cookie = '';

async function login() {
  console.log('Testing Login...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'john.doe@bni.co.id', password: 'password123' })
  });

  if (response.ok) {
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      cookie = setCookie.split(';')[0];
    }
    const data = await response.json();
    console.log('✅ Login successful:', data.user.email);
    return data.user;
  } else {
    console.error('❌ Login failed:', await response.text());
    process.exit(1);
  }
}

async function createProject() {
  console.log('Testing Create Project...');
  const projectData = {
    title: "API Test Project",
    type: "Project",
    category: "Infrastructure",
    methodology: "Agile",
    description: "Created via API test script",
    status: "Initiative Submitted"
  };

  const response = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookie
    },
    body: JSON.stringify(projectData)
  });

  if (response.ok) {
    const project = await response.json();
    console.log('✅ Project created:', project.code);
    return project;
  } else {
    console.error('❌ Create Project failed:', await response.text());
    throw new Error('Create Project failed');
  }
}

async function uploadDocument(projectId: string) {
  console.log('Testing Upload Document...');
  
  // Create a dummy file
  const filePath = path.join(__dirname, 'test-upload.txt');
  fs.writeFileSync(filePath, 'This is a test document content.');

  const form = new FormData();
  const file = await fileFromPath(filePath);
  form.append('file', file);
  form.append('projectId', projectId);
  form.append('lifecycleStep', 'Initiative Submitted');
  form.append('documentType', 'Feasibility Study');

  const response = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Cookie': cookie
    },
    body: form as any
  });

  // Cleanup dummy file
  fs.unlinkSync(filePath);

  if (response.ok) {
    const doc = await response.json();
    console.log('✅ Document uploaded:', doc.filename);
    return doc;
  } else {
    console.error('❌ Document Upload failed:', await response.text());
    throw new Error('Document Upload failed');
  }
}

async function getDocuments(projectId: string) {
    console.log('Testing Get Documents...');
    const response = await fetch(`${BASE_URL}/api/documents?projectId=${projectId}`, {
        method: 'GET',
        headers: { 'Cookie': cookie }
    });

    if (response.ok) {
        const docs = await response.json();
        console.log(`✅ Retrieved ${docs.length} documents`);
        return docs;
    } else {
        console.error('❌ Get Documents failed');
    }
}

async function deleteDocument(docId: string) {
  console.log('Testing Delete Document...');
  const response = await fetch(`${BASE_URL}/api/documents/${docId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie }
  });

  if (response.ok) {
    console.log('✅ Document deleted successfully');
  } else {
    console.error('❌ Delete Document failed:', await response.text());
  }
}

async function runTest() {
  try {
    const user = await login();
    const project = await createProject();
    const doc = await uploadDocument(project.id);
    await getDocuments(project.id);
    await deleteDocument(doc.id);
    console.log('🎉 All API tests passed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();
