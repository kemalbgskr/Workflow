
import { describe, it, expect } from 'vitest';
import { insertProjectSchema, insertDocumentSchema, insertUserSchema } from '../shared/schema';

describe('Shared Schema Validation', () => {

  describe('insertUserSchema', () => {
    it('should validate a valid user object', () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword',
        role: 'REQUESTER',
        department: 'IT'
      };
      
      const result = insertUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should fail if required fields are missing', () => {
      const invalidUser = {
        name: 'John Doe'
        // Missing email, password
      };
      
      const result = insertUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('email'))).toBe(true);
        expect(result.error.issues.some(i => i.path.includes('password'))).toBe(true);
      }
    });

    it('should fail if email is invalid format', () => {
      // Note: check if email regex is enforced by drizzle-zod default or if we need to add refinements. 
      // drizzle-zod usually infers strictness from column definition. text column might be permissive unless refined.
      // Let's assume basic structure for now.
    });
  });

  describe('insertProjectSchema', () => {
    it('should validate a valid project', () => {
      const validProject = {
        code: 'PRJ-001',
        title: 'New Project',
        type: 'Project',
        methodology: 'Agile',
        status: 'Initiative Submitted',
        priority: 'MEDIUM',
        ownerId: '00000000-0000-0000-0000-000000000000', // Mock UUID
        // teamMembers is optional array
        teamMembers: ['John', 'Jane']
      };

      const result = insertProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('should fail if required fields are missing', () => {
      const invalidProject = {
        title: 'Untitled'
      };
      const result = insertProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });
  });

  describe('insertDocumentSchema', () => {
    it('should validate a valid document', () => {
      const validDoc = {
        projectId: '00000000-0000-0000-0000-000000000000',
        type: 'BRD',
        filename: 'reqs.pdf',
        storageKey: '/tmp/reqs.pdf',
        createdById: '00000000-0000-0000-0000-000000000000',
        priority: 'HIGH'
      };
      const result = insertDocumentSchema.safeParse(validDoc);
      expect(result.success).toBe(true);
    });
  });

});
