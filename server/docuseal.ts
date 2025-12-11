// DocuSeal service is already implemented but needs axios
// We'll use fetch API instead for better compatibility
import fs from 'fs';
import { FormData } from 'formdata-node';
import jwt from 'jsonwebtoken';

const DOCUSEAL_API_BASE = process.env.DOCUSEAL_URL || 'http://168.110.206.144:3000';
const DOCUSEAL_WEB_BASE = process.env.DOCUSEAL_URL || 'http://168.110.206.144';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

if (!DOCUSEAL_API_KEY) {
  console.warn('DOCUSEAL_API_KEY not set. Docuseal integration will not work.');
}

export interface DocusealRecipient {
  email: string;
  name: string;
  role: 'signer' | 'viewer' | 'cc';
  orderIndex?: number;
}

export interface CreateEnvelopeParams {
  fileUrl?: string;
  fileBuffer?: Buffer;
  filename: string;
  title: string;
  recipients: DocusealRecipient[];
  sequential?: boolean;
}

export interface DocusealEnvelope {
  id: string;
  url: string;
  status: string;
  recipients: Array<{
    email: string;
    status: string;
    signed_at?: string;
  }>;
}

export class DocusealService {
  async createTemplate(params: CreateEnvelopeParams): Promise<{ templateId: string; editUrl: string }> {
    try {
      if (!DOCUSEAL_API_KEY) {
        throw new Error('DocuSeal API key not configured');
      }

      console.log('Creating DocuSeal template for:', params.title);
      console.log('Recipients:', params.recipients.map(r => r.email));
      
      const formData = new FormData();
      
      // Handle file input
      if (params.fileBuffer) {
        // Convert Buffer to Blob for formdata-node
        // @ts-ignore - Buffer is compatible with BlobPart in Node environment despite type mismatch
        const blob = new Blob([params.fileBuffer], { type: 'application/pdf' });
        formData.append('documents[0][file]', blob, params.filename);
      }
      
      // If we had a URL-based file upload, we'd handle it here, but DocuSeal primarily takes file uploads for basic API usage
      // or "documents" array with name/file.
      
      formData.append('name', params.title);
      
      // Logic for documents from PDF: 
      // POST /api/templates/pdf 
      // documentation says: create a template from PDF
      
      // Let's stick to /api/templates and uploading the file.
      // Based on docs: 
      // curl -X POST https://api.docuseal.com/templates \
      //   -H "X-Auth-Token: <token>" \
      //   -F "documents[0][file]=@document.pdf" \
      //   -F "documents[0][name]=Agreement"
      
      console.log('Sending request to:', `${DOCUSEAL_API_BASE}/api/templates`);

      const response = await fetch(`${DOCUSEAL_API_BASE}/api/templates`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': DOCUSEAL_API_KEY,
        },
        body: formData as any
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('DocuSeal API error response:', errorText);
        throw new Error(`DocuSeal API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('DocuSeal template created:', result);
      
      // Handle array response (if batch creation) or single object
      const templateData = Array.isArray(result) ? result[0] : result;
      
      return {
        templateId: templateData.id.toString(),
        editUrl: `${DOCUSEAL_WEB_BASE}/templates/${templateData.id}/edit`
      };
    } catch (error: any) {
      console.error('DocuSeal createTemplate error:', error.message);
      if (error.cause) console.error('DocuSeal createTemplate cause:', error.cause);
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  async getBuilderToken(params: {
    user_email: string;
    integration_email?: string;
    name: string;
    document_urls?: string[];
    document_b64?: string; // Optional if supported by integration
  }): Promise<string> {
    if (!DOCUSEAL_API_KEY) {
      throw new Error('DocuSeal API key not configured');
    }

    const payload = {
      user_email: params.user_email,
      integration_email: params.integration_email,
      name: params.name,
      document_urls: params.document_urls,
      // Create template mode
    };

    return jwt.sign(payload, DOCUSEAL_API_KEY);
  }

  async createSubmission(templateId: string, submitters: DocusealRecipient[]): Promise<{ submissionId: string; url: string }> {
    try {
      if (!DOCUSEAL_API_KEY) {
        throw new Error('DocuSeal API key not configured');
      }

      const payload = {
        template_id: parseInt(templateId),
        submitters: submitters.map((submitter, index) => ({
          name: submitter.name,
          role: `Signer ${index + 1}`,
          email: submitter.email
        }))
      };

      console.log('Creating DocuSeal submission:', JSON.stringify(payload, null, 2));
      console.log('Sending to:', `${DOCUSEAL_API_BASE}/api/submissions`);

      const response = await fetch(`${DOCUSEAL_API_BASE}/api/submissions`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': DOCUSEAL_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Submission response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DocuSeal submission error:', errorText);
        throw new Error(`DocuSeal API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('DocuSeal submission created:', result);
      
      return {
        submissionId: result.id?.toString() || result.slug,
        url: result.url || `${DOCUSEAL_WEB_BASE}/s/${result.slug}`
      };
    } catch (error: any) {
      console.error('DocuSeal createSubmission error:', error.message);
      throw new Error(`Failed to create submission: ${error.message}`);
    }
  }

  async createEnvelope(params: CreateEnvelopeParams): Promise<{ envelopeId: string; url: string }> {
    // For backward compatibility, create template first
    const template = await this.createTemplate(params);
    return {
      envelopeId: template.templateId,
      url: template.editUrl
    };
  }

  async getEnvelope(envelopeId: string): Promise<DocusealEnvelope> {
    try {
      // Mock envelope data
      return {
        id: envelopeId,
        url: `${DOCUSEAL_API_BASE}/envelopes/${envelopeId}/sign`,
        status: 'sent',
        recipients: []
      };
    } catch (error: any) {
      console.error('Docuseal getEnvelope error:', error.message);
      throw new Error(`Failed to get envelope: ${error.message}`);
    }
  }

  async downloadCompletedPdf(envelopeId: string): Promise<Buffer> {
    try {
      // Mock PDF download
      return Buffer.from('Mock PDF content');
    } catch (error: any) {
      console.error('Docuseal downloadCompletedPdf error:', error.message);
      throw new Error(`Failed to download PDF: ${error.message}`);
    }
  }

  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    try {
      console.log(`Voiding envelope ${envelopeId} with reason: ${reason}`);
      // Mock void operation
    } catch (error: any) {
      console.error('Docuseal voidEnvelope error:', error.message);
      throw new Error(`Failed to void envelope: ${error.message}`);
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;
    if (!secret) return false;
    
    // Implement HMAC verification based on Docuseal's webhook signature method
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

export const docusealService = new DocusealService();
