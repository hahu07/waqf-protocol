// src/components/admin/userManager.tsx
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, Tab } from '@/components/ui/Tabs';
import { AdminList } from './AdminList';
import { AddAdminForm } from './AddAdminForm';
import { AuditLog } from './AuditLog';
import type { AdminManagerProps } from './types';
import { useState } from 'react';

export function UserManager({ 
  showHeader = true,
  headerTitle = 'User Management'
}: AdminManagerProps) {
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('administrators');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Admin privileges required to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {headerTitle}
            </h1>
            <p className="text-gray-600">Manage administrators and monitor user activity</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Current User:</span>
            <span className="text-sm font-medium text-gray-900 px-3 py-1 bg-gray-100 rounded-full">
              {user?.key?.substring(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('administrators')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'administrators'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>👥</span>
                Administrators
              </span>
              {activeTab === 'administrators' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)' }} />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors relative ${
                activeTab === 'audit'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <span>📜</span>
                Audit Log
              </span>
              {activeTab === 'audit' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)' }} />
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'administrators' && (
            <div className="space-y-6">
              <AddAdminForm currentUserId={user?.key} />
              <AdminList />
            </div>
          )}

          {activeTab === 'audit' && (
            <AuditLog />
          )}
        </div>
      </div>
    </div>
  );
}
