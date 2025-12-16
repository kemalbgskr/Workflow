import { describe, it, expect, beforeAll } from 'vitest';
import { DatabaseStorage } from '../server/storage';

describe('Storage Layer Tests', () => {
  let storage: DatabaseStorage;

  beforeAll(() => {
    storage = new DatabaseStorage();
  });

  describe('User Operations', () => {
    it('should have getUser method', () => {
      expect(storage.getUser).toBeDefined();
      expect(typeof storage.getUser).toBe('function');
    });

    it('should have getUserByEmail method', () => {
      expect(storage.getUserByEmail).toBeDefined();
      expect(typeof storage.getUserByEmail).toBe('function');
    });

    it('should have getUsers method', () => {
      expect(storage.getUsers).toBeDefined();
      expect(typeof storage.getUsers).toBe('function');
    });
  });

  describe('Project Operations', () => {
    it('should have getProjectById method', () => {
      expect(storage.getProjectById).toBeDefined();
      expect(typeof storage.getProjectById).toBe('function');
    });

    it('should have updateProject method', () => {
      expect(storage.updateProject).toBeDefined();
      expect(typeof storage.updateProject).toBe('function');
    });

    it('should have deleteProject method', () => {
      expect(storage.deleteProject).toBeDefined();
      expect(typeof storage.deleteProject).toBe('function');
    });

    it('should have getProjectsForUser method', () => {
      expect(storage.getProjectsForUser).toBeDefined();
      expect(typeof storage.getProjectsForUser).toBe('function');
    });

    it('should have checkProjectAccess method', () => {
      expect(storage.checkProjectAccess).toBeDefined();
      expect(typeof storage.checkProjectAccess).toBe('function');
    });
  });

  describe('Document Operations', () => {
    it('should have getDocumentById method', () => {
      expect(storage.getDocumentById).toBeDefined();
      expect(typeof storage.getDocumentById).toBe('function');
    });

    it('should have getDocuments method', () => {
      expect(storage.getDocuments).toBeDefined();
      expect(typeof storage.getDocuments).toBe('function');
    });
  });

  describe('Approval Operations', () => {
    it('should have getProjectApprovers method', () => {
      expect(storage.getProjectApprovers).toBeDefined();
      expect(typeof storage.getProjectApprovers).toBe('function');
    });

    it('should have createStatusChangeRequest method', () => {
      expect(storage.createStatusChangeRequest).toBeDefined();
      expect(typeof storage.createStatusChangeRequest).toBe('function');
    });

    it('should have getPendingStatusApprovals method', () => {
      expect(storage.getPendingStatusApprovals).toBeDefined();
      expect(typeof storage.getPendingStatusApprovals).toBe('function');
    });
  });

  describe('Audit Log Operations', () => {
    it('should have insertAuditLog method', () => {
      expect(storage.insertAuditLog).toBeDefined();
      expect(typeof storage.insertAuditLog).toBe('function');
    });

    it('should have getProjectAuditLogs method', () => {
      expect(storage.getProjectAuditLogs).toBeDefined();
      expect(typeof storage.getProjectAuditLogs).toBe('function');
    });
  });

  describe('Comments Operations', () => {
    it('should have getProjectComments method', () => {
      expect(storage.getProjectComments).toBeDefined();
      expect(typeof storage.getProjectComments).toBe('function');
    });

    it('should have comments-related methods', () => {
      expect(storage.getProjectComments).toBeDefined();
      expect(typeof storage.getProjectComments).toBe('function');
    });
  });
});
