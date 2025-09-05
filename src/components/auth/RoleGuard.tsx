import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: User['role'][];
  fallback?: ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive" className="m-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar esta funcionalidade.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

// Hook para verificar permissões
export function usePermissions() {
  const { user } = useAuth();

  const hasRole = (role: User['role'] | User['role'][]) => {
    if (!user) return false;
    return Array.isArray(role) ? role.includes(user.role) : user.role === role;
  };

  const canCreate = () => hasRole(['admin', 'gerente']);
  const canEdit = () => hasRole(['admin', 'gerente']);
  const canDelete = () => hasRole('admin');
  const canViewReports = () => hasRole(['admin', 'gerente']);
  const canManageUsers = () => hasRole('admin');
  const canManageFiliais = () => hasRole('admin');

  return {
    hasRole,
    canCreate,
    canEdit,
    canDelete,
    canViewReports,
    canManageUsers,
    canManageFiliais,
  };
}