import type { InsertProject, InsertComment, Project, User, Document, Comment } from "@shared/schema";

const API_BASE = '/api';

class ApiClient {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text as T;
    }
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: Omit<InsertProject, "ownerId" | "code">): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateProjectStatus(id: string, status: string) {
    return this.request(`/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async archiveProject(id: string) {
    return this.request(`/projects/${id}/archive`, {
      method: 'PUT',
    });
  }

  async duplicateProject(id: string) {
    return this.request(`/projects/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async deleteDocument(id: string) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Approvals
  async getApprovals() {
    return this.request('/approvals');
  }

  async approveDocument(id: string) {
    return this.request(`/approvals/${id}/approve`, {
      method: 'POST',
    });
  }

  async declineDocument(id: string) {
    return this.request(`/approvals/${id}/decline`, {
      method: 'POST',
    });
  }

  // Comments
  async addComment(documentId: string, data: Omit<InsertComment, "documentId" | "authorId">): Promise<Comment> {
    return this.request<Comment>(`/documents/${documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }
}

export const api = new ApiClient();
export type { ApiClient };