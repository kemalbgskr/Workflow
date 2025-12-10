import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'APPROVER' | 'REQUESTER';
  department?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string) => user?.role === role;
  const hasAnyRole = (roles: string[]) => user?.role && roles.includes(user.role);

  const canApprove = () => hasAnyRole(['ADMIN', 'APPROVER']);
  const canViewApprovals = () => hasAnyRole(['ADMIN', 'APPROVER']);
  const canUploadDocument = () => hasAnyRole(['ADMIN', 'REQUESTER']);
  const canUpdateProjectStatus = () => hasAnyRole(['ADMIN', 'REQUESTER']);
  const canManageUsers = () => hasRole('ADMIN');
  const canConfigureApprovers = () => true;
  const canDeleteProject = () => hasRole('ADMIN');
  const canViewUsers = () => hasRole('ADMIN');

  return {
    user,
    loading,
    hasRole,
    hasAnyRole,
    canApprove,
    canViewApprovals,
    canUploadDocument,
    canUpdateProjectStatus,
    canManageUsers,
    canConfigureApprovers,
    canDeleteProject,
    canViewUsers,
    checkAuth
  };
}