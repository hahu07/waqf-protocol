'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addAdmin, type AdminPermission, type AdminRole } from '@/lib/admin-utils';
import { Button } from '@/components/ui/button';
import { CustomDialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const permissionOptions: { id: AdminPermission; label: string }[] = [
  { id: 'content', label: 'Content Management' },
  { id: 'users', label: 'User Management' },
  { id: 'settings', label: 'System Settings' },
  { id: 'super', label: 'Super Admin' }
];

interface AddAdminFormProps {
  currentUserId?: string;
}

export function AddAdminForm({ currentUserId }: AddAdminFormProps) {
  const [userId, setUserId] = useState('');
  const [permissions, setPermissions] = useState<AdminPermission[]>(['content']);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const getRoleFromPermissions = (perms: AdminPermission[]): AdminRole => {
    if (perms.includes('super')) return 'super_admin';
    if (perms.includes('settings')) return 'manager';
    if (perms.includes('users')) return 'editor';
    return 'viewer';
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Not authenticated');
      await addAdmin(userId, currentUserId, 
        getRoleFromPermissions(permissions), '', '', permissions);
    },
    onSuccess: () => {
      setSuccess(`${userId} added as admin`);
      setUserId('');
      setPermissions(['content']);
      setOpenConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (error: Error) => {
      setError(error.message);
      setOpenConfirm(false);
    }
  });

  const togglePermission = (permission: AdminPermission, checked: boolean) => {
    setPermissions(prev =>
      checked
        ? [...prev, permission]
        : prev.filter(p => p !== permission)
    );
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg max-w-full">
      <h2 className="text-lg md:text-xl font-medium">Add New Admin</h2>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          setSuccess('');
          setOpenConfirm(true);
        }} 
        className="space-y-4"
      >
        <div className="space-y-2 w-full">
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2 w-full">
          <Label>Permissions</Label>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {permissionOptions.map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <Checkbox
                  id={option.id}
                  checked={permissions.includes(option.id)}
                  onChange={(e) => 
                    togglePermission(option.id, e.target.checked)
                  }
                />
                <Label htmlFor={option.id} className="text-sm sm:text-base">{option.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <Button 
          type="submit" 
          loading={mutation.isPending} 
          className="w-full sm:w-auto"
        >
          Add Admin
        </Button>

        <CustomDialog 
          isOpen={openConfirm} 
          onClose={() => setOpenConfirm(false)}
          title="Confirm Admin Privileges"
          className="max-w-[95vw] sm:max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to grant admin privileges to {userId}?
            </p>
            {permissions.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">Permissions:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  {permissions.map(p => (
                    <li key={p}>
                      {permissionOptions.find(o => o.id === p)?.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpenConfirm(false)}
                loading={false}
              >
                Cancel
              </Button>
              <Button 
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming...
                  </span>
                ) : 'Confirm'}
              </Button>
            </div>
          </div>
        </CustomDialog>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
      </form>
    </div>
  );
}