#!/usr/bin/env node

/**
 * Test script for DocuSeal integration
 * This script creates a sample envelope with a test PDF for local testing
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const DOCUSEAL_API_BASE = process.env.DOCUSEAL_API_BASE || 'https://api.docuseal.co';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

if (!DOCUSEAL_API_KEY) {
  console.error('DOCUSEAL_API_KEY environment variable is required');
  process.exit(1);
}

// Create a simple test PDF content (this is a minimal PDF structure)
const createTestPDF = () => {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(BNI SDLC Test Document) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000369 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
466
%%EOF`;

  const testPdfPath = path.join(process.cwd(), 'test-document.pdf');
  fs.writeFileSync(testPdfPath, pdfContent);
  return testPdfPath;
};

const testDocuSealIntegration = async () => {
  try {
    console.log('🧪 Testing DocuSeal Integration...\n');

    // Create test PDF
    console.log('📄 Creating test PDF document...');
    const testPdfPath = createTestPDF();
    console.log(`✅ Test PDF created: ${testPdfPath}\n`);

    // Read the PDF file
    const pdfBuffer = fs.readFileSync(testPdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Create envelope payload
    const envelopeData = {
      name: 'BNI SDLC Test Document',
      documents: [
        {
          name: 'test-document.pdf',
          file: `data:application/pdf;base64,${pdfBase64}`
        }
      ],
      recipients: [
        {
          email: 'test@example.com',
          name: 'Test Approver',
          role: 'signer'
        }
      ],
      send_email: false // Don't send actual emails during testing
    };

    console.log('🚀 Creating DocuSeal envelope...');
    console.log(`📡 API Endpoint: ${DOCUSEAL_API_BASE}/envelopes`);
    console.log(`🔑 Using API Key: ${DOCUSEAL_API_KEY.substring(0, 8)}...`);

    const response = await fetch(`${DOCUSEAL_API_BASE}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DOCUSEAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envelopeData)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DocuSeal API Error:');
      console.error(`Status: ${response.status}`);
      console.error(`Response: ${errorText}`);
      return;
    }

    const envelope = await response.json();
    console.log('✅ Envelope created successfully!');
    console.log(`📋 Envelope ID: ${envelope.id}`);
    console.log(`🔗 Envelope URL: ${envelope.url || 'N/A'}`);
    console.log(`📧 Recipients: ${envelope.recipients?.length || 0}`);

    // Test getting envelope details
    console.log('\n🔍 Testing envelope retrieval...');
    const getResponse = await fetch(`${DOCUSEAL_API_BASE}/envelopes/${envelope.id}`, {
      headers: {
        'Authorization': `Bearer ${DOCUSEAL_API_KEY}`
      }
    });

    if (getResponse.ok) {
      const envelopeDetails = await getResponse.json();
      console.log('✅ Envelope retrieved successfully!');
      console.log(`📊 Status: ${envelopeDetails.status}`);
      console.log(`📅 Created: ${envelopeDetails.created_at}`);
    } else {
      console.log('⚠️  Could not retrieve envelope details');
    }

    // Clean up test file
    fs.unlinkSync(testPdfPath);
    console.log('\n🧹 Test PDF cleaned up');

    console.log('\n🎉 DocuSeal integration test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Set up webhook endpoint for real-time updates');
    console.log('2. Configure proper recipient emails');
    console.log('3. Test signature completion workflow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('🌐 Network error: Could not reach DocuSeal API');
      console.error('   Check your internet connection and API endpoint');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔒 Connection refused: API endpoint may be incorrect');
    }
    
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify DOCUSEAL_API_KEY is correct');
    console.error('2. Check DOCUSEAL_API_BASE URL');
    console.error('3. Ensure API key has proper permissions');
    console.error('4. Check DocuSeal service status');
  }
};

// Run the test
testDocuSealIntegration();