// components/admin/adminManage.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { listAdmins, addAdmin, hasPermission, type AdminPermission } from '@/lib/admin-utils';
import { AdminList } from './AdminList';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const PERMISSIONS: AdminPermission[] = ['content', 'users', 'settings', 'super'];

export function AdminManage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>(['content']);
  
  const { data: admins, isLoading, refetch } = useQuery({
    queryKey: ['admins'],
    queryFn: listAdmins
  });

  const addAdminMutation = useMutation({
    mutationFn: async () => {
      await addAdmin(userId, 'system', 'viewer', '', '', selectedPermissions);
    },
    onSuccess: () => {
      toast.success('Admin added successfully');
      setUserId('');
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Unknown error');
    }
  });

  const togglePermission = (permission: AdminPermission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Admins</h1>
      
      {/* Add Admin Form */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add New Admin</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
          
          <div>
            <Label>Permissions</Label>
            <div className="space-y-2 mt-2">
              {PERMISSIONS.map((permission) => (
                <div key={permission} className="flex items-center gap-2">
                  <Checkbox
                    id={`perm-${permission}`}
                    checked={selectedPermissions.includes(permission)}
                    onChange={(e) => {
                      e.preventDefault();
                      togglePermission(permission);
                    }}
                  />
                  <Label htmlFor={`perm-${permission}`} className="font-normal capitalize">
                    {permission}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <Button
            onClick={() => addAdminMutation.mutate()}
            disabled={!userId || addAdminMutation.isPending}
            loading={addAdminMutation.isPending}
          >
            {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
          </Button>
        </div>
      </div>
      
      {/* Admin List */}
      <div className="border rounded-lg p-6">
        <AdminList headerTitle="Current Admins" admins={admins} isLoading={isLoading} />
      </div>
    </div>
  );
}