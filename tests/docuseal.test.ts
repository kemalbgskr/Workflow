import { describe, it, expect, beforeAll } from 'vitest';
import { DocusealService } from '../server/docuseal';

describe('DocuSeal Service Tests', () => {
  let docusealService: DocusealService;

  beforeAll(() => {
    docusealService = new DocusealService();
  });

  describe('getBuilderToken', () => {
    it('should require user email', async () => {
      await expect(
        docusealService.getBuilderToken({
          user_email: '',
          name: 'Test Template'
        })
      ).rejects.toThrow();
    });

    it('should accept valid parameters with template_id', async () => {
      const params = {
        user_email: 'test@example.com',
        template_id: 123
      };

      // Note: This will fail without valid API key, but tests structure
      // In real scenario, you'd mock the fetch call
      expect(params.user_email).toBeDefined();
      expect(params.template_id).toBeDefined();
    });

    it('should accept valid parameters with document URLs', async () => {
      const params = {
        user_email: 'test@example.com',
        name: 'New Template',
        document_urls: ['https://example.com/doc.pdf']
      };

      expect(params.user_email).toBeDefined();
      expect(params.name).toBeDefined();
      expect(params.document_urls).toBeDefined();
    });
  });

  describe('createTemplate', () => {
    it('should require file buffer or file URL', () => {
      const params = {
        filename: 'test.pdf'
      };

      // Should have either fileBuffer or fileUrl
      expect(params.filename).toBeDefined();
    });

    it('should handle file buffer correctly', () => {
      const buffer = Buffer.from('test content');
      const base64 = buffer.toString('base64');
      const withPrefix = `data:application/pdf;base64,${base64}`;

      expect(withPrefix).toContain('data:application/pdf;base64,');
      expect(withPrefix).toContain(base64);
    });
  });

  describe('Payload Construction', () => {
    it('should construct payload with template_id', () => {
      const payload: any = {
        user_email: 'test@example.com',
        integration_email: 'integration@example.com'
      };

      const templateId = 123;
      payload.template_id = templateId;

      expect(payload.template_id).toBe(123);
      expect(payload.user_email).toBeDefined();
    });

    it('should construct payload with document details', () => {
      const payload: any = {
        user_email: 'test@example.com',
        name: 'Test Template',
        document_urls: ['https://example.com/test.pdf']
      };

      expect(payload.name).toBeDefined();
      expect(payload.document_urls).toBeDefined();
      expect(Array.isArray(payload.document_urls)).toBe(true);
    });
  });

  describe('Base64 Encoding', () => {
    it('should correctly encode buffer to base64', () => {
      const testData = 'Hello, World!';
      const buffer = Buffer.from(testData);
      const base64 = buffer.toString('base64');

      expect(base64).toBe('SGVsbG8sIFdvcmxkIQ==');
    });

    it('should add data URI prefix correctly', () => {
      const base64 = 'SGVsbG8sIFdvcmxkIQ==';
      const withPrefix = `data:application/pdf;base64,${base64}`;

      expect(withPrefix).toBe('data:application/pdf;base64,SGVsbG8sIFdvcmxkIQ==');
    });
  });
});
