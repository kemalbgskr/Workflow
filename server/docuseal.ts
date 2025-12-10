// DocuSeal service is already implemented but needs axios
// We'll use fetch API instead for better compatibility
import fs from 'fs';
import { FormData } from 'formdata-node';

const DOCUSEAL_API_BASE = process.env.DOCUSEAL_API_BASE || 'http://168.110.206.144:3000';
const DOCUSEAL_WEB_BASE = process.env.DOCUSEAL_WEB_BASE || 'http://168.110.206.144:3000';
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

if (!DOCUSEAL_API_KEY) {
  console.warn('DOCUSEAL_API_KEY not set. Docuseal integration will not work.');
}

const createHeaders = (contentType = 'application/json') => ({
  'Authorization': `Bearer ${DOCUSEAL_API_KEY}`,
  'Content-Type': contentType
});

export interface DocusealRecipient {
  email: string;
  name: string;
  role: 'signer' | 'viewer';
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
      
      if (params.fileBuffer) {
        formData.append('files[]', params.fileBuffer, params.filename);
      }

      formData.append('name', params.title);
      
      // Add submitters according to DocuSeal API docs
      params.recipients.forEach((recipient, index) => {
        formData.append(`submitters[][name]`, recipient.name);
        formData.append(`submitters[][role]`, `Signer ${index + 1}`);
      });

      console.log('Sending request to:', `${DOCUSEAL_API_BASE}/api/templates`);
      console.log('With headers:', { 'X-Auth-Token': DOCUSEAL_API_KEY });

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
      
      return {
        templateId: result.id.toString(),
        editUrl: `${DOCUSEAL_WEB_BASE}/templates/${result.id}/edit`
      };
    } catch (error: any) {
      console.error('DocuSeal createTemplate error:', error.message);
      throw new Error(`Failed to create template: ${error.message}`);
    }
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
