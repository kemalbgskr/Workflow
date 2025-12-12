
import 'dotenv/config';

async function probeDocuseal() {
  const apiKey = process.env.DOCUSEAL_API_KEY;
  const url = process.env.DOCUSEAL_URL || 'https://docuseal.com';

  console.log(`Testing DocuSeal API at ${url}`);
  
  // Minimal PDF Base64 (Blank page)
  const pdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgRlbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2wKICAvUGFyZW50IDIgMCBSCj4+CmVuZG9iagoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDExMSAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNAogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxNzMKJSVFT0YK";

  const payload = {
    name: "Probe Template",
    documents: [{
      name: "probe.pdf",
      file: pdfBase64
    }]
  };

  // Try to list submissions to verify API key and endpoint
  console.log("Attempting GET /api/submissions ...");
  try {
    const res = await fetch(`${url}/api/submissions?limit=1`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': apiKey || '',
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log("Response:", text.substring(0, 500));
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

probeDocuseal();
