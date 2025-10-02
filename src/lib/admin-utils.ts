// src/lib/admin-utils.ts
import { listDocs, getDoc, setDoc, deleteDoc, type Doc } from '@junobuild/core';

type AdminPermission = 'content' | 'users' | 'settings' | 'super';

type AdminRole = 'viewer' | 'editor' | 'manager' | 'super_admin';

interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: number;
  createdBy: string;
  permissions: AdminPermission[];
  updatedAt?: number;
  updatedBy?: string;
  lastActive?: number;
  deleted?: boolean;
  deletedAt?: number;
  deletedBy?: string;
}

interface AdminDoc extends Doc<AdminUser> {
  hooks?: {
    assert?: string[];
    post?: string[];
  };
}

const ADMIN_COLLECTION = 'admins';
const AUDIT_COLLECTION = 'admin_audit';

type AuditData = {
  action: string;
  targetUserId: string;
  performedBy: string;
  timestamp: number;
  details?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, string>;
};

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  viewer: ['content'],
  editor: ['content', 'users'],
  manager: ['content', 'users', 'settings'],
  super_admin: ['content', 'users', 'settings', 'super']
};

const logAudit = async (
  action: string,
  targetUserId: string,
  performedBy: string,
  details: string = ''
) => {
  try {
    await setDoc<AuditData>({
      collection: AUDIT_COLLECTION,
      doc: {
        key: `${Date.now()}-${action}`,
        data: {
          action,
          targetUserId,
          performedBy,
          timestamp: Date.now(),
          details,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          ipAddress: 'captured-by-juno'
        }
      }
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};

const validateAdminUser = (data: Partial<AdminUser>): data is AdminUser => {
  return (
    !!data.userId &&
    !!data.email &&
    !!data.name &&
    !!data.role &&
    !!data.createdAt &&
    !!data.createdBy &&
    Array.isArray(data.permissions) &&
    data.permissions.every(permission => ['content', 'users', 'settings', 'super'].includes(permission))
  );
};

const validateRolePermissions = (user: AdminUser) => {
  const allowedPermissions = ROLE_PERMISSIONS[user.role];
  return user.permissions.every(perm => allowedPermissions.includes(perm));
};


const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const admin = await getDoc<AdminUser>({
      collection: ADMIN_COLLECTION,
      key: userId
    });
    return !!admin;
  } catch (error) {
    console.error('Failed to check admin status:', error);
    return false;
  }
};

const hasPermission = async (
  userId: string,
  permission: AdminPermission
): Promise<boolean> => {
  try {
    const admin = await getDoc<AdminUser>({
      collection: ADMIN_COLLECTION,
      key: userId
    });
    return admin?.data?.permissions?.includes(permission) || false;
  } catch (error) {
    console.error('Failed to check permissions:', error);
    return false;
  }
};

const addAdmin = async (
  userId: string,
  currentUserId: string,
  role: AdminRole = 'viewer',
  email: string = '',
  name: string = '',
  permissions?: AdminPermission[]
): Promise<void> => {
  const adminDoc: AdminDoc = {
    key: userId,
    data: {
      userId,
      email,
      name,
      role,
      permissions: permissions ?? ROLE_PERMISSIONS[role],
      createdAt: Date.now(),
      createdBy: currentUserId,
      lastActive: Date.now()
    },
    hooks: {
      assert: ['assert_admin_operations']
    }
  };

  try {
    await setDoc<AdminUser>({
      collection: ADMIN_COLLECTION,
      doc: adminDoc
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Only super admins')) {
      throw new Error('Permission denied: Requires super admin privileges');
    }
    throw error;
  }
};

const removeAdmin = async (
  userId: string,
  currentUserId: string
): Promise<void> => {
  if (!userId || !currentUserId) {
    throw new Error('Missing required fields: userId and currentUserId');
  }

  const existing = await getDoc<AdminUser>({
    collection: ADMIN_COLLECTION,
    key: userId
  });

  if (!existing) {
    throw new Error(`Admin not found: ${userId}`);
  }

  try {
    // Phase 1: Prepare updated data
    const updatedData: AdminUser = {
      ...existing.data,
      deleted: true,
      deletedAt: Date.now(),
      deletedBy: currentUserId
    };

    // Phase 2: Atomic update
    await setDoc<AdminUser>({
      collection: ADMIN_COLLECTION,
      doc: {
        key: userId,
        data: updatedData
      }
    });

    // Phase 3: Audit log (with rollback on failure)
    try {
      await logAudit('remove_admin', userId, currentUserId);
    } catch (auditError) {
      // Rollback
      await setDoc<AdminUser>({
        collection: ADMIN_COLLECTION,
        doc: {
          key: userId,
          data: existing.data // Restore original data
        }
      });
      throw new Error(`Admin removal rolled back due to audit failure: ${auditError instanceof Error ? auditError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`Admin removal failed for user ${userId}:`, error instanceof Error ? error.stack : error);
    throw new Error(`Admin removal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const updateAdmin = async (
  userId: string,
  currentUserId: string,
  role?: AdminRole,
  permissions?: AdminPermission[],
  email?: string,
  name?: string
): Promise<void> => {
  if (!userId || !currentUserId) {
    throw new Error('Missing required fields');
  }

  try {
    const existing = await getDoc<AdminUser>({
      collection: ADMIN_COLLECTION,
    key: userId
  });

  if (!existing) {
    throw new Error('Admin not found');
  }

  if (role && !await hasPermission(currentUserId, 'super')) {
    throw new Error('Only super admins can change roles');
  }

  const updatedData: AdminUser = {
    ...existing.data,
    ...(role && { 
      role,
      permissions: ROLE_PERMISSIONS[role] 
    }),
    ...(email && { email }),
    ...(name && { name }),
    updatedAt: Date.now(),
    updatedBy: currentUserId
  };

  if (!validateAdminUser(updatedData) || !validateRolePermissions(updatedData)) {
    throw new Error('Invalid admin data');
  }

    await setDoc<AdminUser>({
      collection: ADMIN_COLLECTION,
    doc: {
      key: userId,
      data: updatedData
    }
  });

    await logAudit('update_permissions', userId, currentUserId, JSON.stringify({role, email, name}));
  } catch (error) {
    console.error('Failed to update admin:', error);
    throw new Error(`Admin update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const listAdmins = async (): Promise<Doc<AdminUser>[]> => {
  try {
    const { items } = await listDocs<AdminUser>({
      collection: ADMIN_COLLECTION
    });
    return items;
  } catch (error) {
    console.error('Failed to list admins:', error);
    return [];
  }
};

export {
  ADMIN_COLLECTION,
  AUDIT_COLLECTION,
  listAdmins,
  isAdmin,
  hasPermission,
  addAdmin,
  removeAdmin,
  updateAdmin,
  logAudit
};

export type { AdminPermission, AdminRole, AdminUser, AuditData };