import { AdminRole, AdminPermission } from './admin-utils';

export const getPermissionsForRole = (role: AdminRole): AdminPermission[] => {
  const permissions: Record<AdminRole, AdminPermission[]> = {
    viewer: ['content'],
    editor: ['content', 'users'],
    manager: ['content', 'users', 'settings'],
    super_admin: ['content', 'users', 'settings', 'super']
  };
  return permissions[role];
};

export const canAssignRole = (
  assignerRole: AdminRole,
  targetRole: AdminRole
): boolean => {
  const roleHierarchy: AdminRole[] = [
    'viewer',
    'editor',
    'manager',
    'super_admin'
  ];
  
  return roleHierarchy.indexOf(assignerRole) >= roleHierarchy.indexOf(targetRole);
};

export const hasMinimumRole = (
  userRole: AdminRole,
  requiredRole: AdminRole
): boolean => {
  const roleOrder: Record<AdminRole, number> = {
    viewer: 0,
    editor: 1,
    manager: 2,
    super_admin: 3
  };
  return roleOrder[userRole] >= roleOrder[requiredRole];
};
