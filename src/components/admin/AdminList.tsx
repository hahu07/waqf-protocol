// src/components/admin/AdminList.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { removeAdmin, updateAdmin, logAudit, type AdminPermission, type AdminRole } from '@/lib/admin-utils';
import { useState } from 'react';
import type { AdminManagerProps } from './types';

const getRoleFromPermissions = (permissions: AdminPermission[]): AdminRole => {
  if (permissions.includes('super')) return 'super_admin';
  if (permissions.includes('settings')) return 'manager';
  if (permissions.includes('users')) return 'editor';
  return 'viewer';
};

export function AdminList({ admins, isLoading, headerTitle, refetch }: AdminManagerProps & { refetch?: () => void }) {
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null);
  const [adminToEdit, setAdminToEdit] = useState<{userId: string; permissions: AdminPermission[]} | null>(null);

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      await removeAdmin(userId, 'system');
    },
    onSuccess: () => {
      toast.success('Admin removed successfully');
      setAdminToRemove(null);
      refetch?.();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove admin');
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ userId, permissions }: {userId: string; permissions: AdminPermission[]}) => {
      const role = getRoleFromPermissions(permissions);
      await updateAdmin(userId, 'system', role, permissions);
    },
    onSuccess: () => {
      toast.success('Permissions updated successfully');
      setAdminToEdit(null);
      refetch?.();
      logAudit('admin_permissions_updated', adminToEdit!.userId, 'system', 
        adminToEdit!.permissions.join(', '));
    },
    onError: (error) => {
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update permissions',
        {
          duration: 5000,
          action: {
            label: 'Retry',
            onClick: () => {
              if (adminToEdit) {
                editMutation.mutate(adminToEdit);
              }
            }
          }
        }
      );
    }
  });

  if (isLoading) return (
    <div className="border rounded-lg p-6 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
    </div>
  );
  if (!admins?.length) return <div className="text-gray-500">No admins found</div>;

  const activeAdmins = admins.filter(admin => !admin.data.deleted);

  return (
    <div className="space-y-4">
      {headerTitle && <h2 className="text-lg font-semibold">{headerTitle}</h2>}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">User ID</TableHead>
                <TableHead className="text-xs sm:text-sm">Name</TableHead>
                <TableHead className="text-xs sm:text-sm">Email</TableHead>
                <TableHead className="text-xs sm:text-sm">Permissions</TableHead>
                <TableHead className="text-xs sm:text-sm">Added On</TableHead>
                <TableHead className="text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeAdmins.map((admin) => (
                <TableRow key={admin.key}>
                  <TableCell className="text-xs sm:text-sm">{admin.key}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{admin.data.name}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{admin.data.email}</TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    <div className="flex flex-wrap gap-1">
                      {admin.data.permissions.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {new Date(admin.data.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const foundAdmin = admins.find(a => a.key === admin.key);
                        if (foundAdmin) {
                          setAdminToEdit({
                            userId: foundAdmin.key,
                            permissions: foundAdmin.data.permissions
                          });
                        }
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setAdminToRemove(admin.key)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Remove confirmation dialog */}
      {adminToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold">Confirm Removal</h3>
            <p className="my-4">Are you sure you want to remove this admin?</p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setAdminToRemove(null)}
                loading={false}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => removeMutation.mutate(adminToRemove)}
                loading={removeMutation.isPending}
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}