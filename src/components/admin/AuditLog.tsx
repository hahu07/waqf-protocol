// src/components/admin/AuditLog.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { listDocs, type Doc } from '@junobuild/core';
import { AUDIT_COLLECTION } from '@/lib/admin-utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AuditLogData {
  action: string;
  targetUserId: string;
  performedBy: string;
  timestamp: number;
}

type AuditLogEntry = Doc<AuditLogData>;

export function AuditLog() {
  const { data: logs, isLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ['admin_audit'],
    queryFn: async () => {
      const { items } = await listDocs<AuditLogData>({
        collection: AUDIT_COLLECTION
      });
      return items;
    }
  });
  
  if (isLoading) return (
    <div className="border rounded-lg p-6 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
    </div>
  );
  if (!logs || logs.length === 0) return <div className="text-gray-500">No audit logs found</div>;

  return (
    <div className="border rounded-lg overflow-hidden mt-4">
      <h3 className="font-medium p-3 sm:p-4 border-b text-sm sm:text-base">Admin Activity Log</h3>
      <div className="overflow-x-auto">
        <Table className="min-w-[600px] sm:min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm">Action</TableHead>
              <TableHead className="text-xs sm:text-sm">Target User</TableHead>
              <TableHead className="text-xs sm:text-sm">Performed By</TableHead>
              <TableHead className="text-xs sm:text-sm">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.key}>
                <TableCell className="text-xs sm:text-sm">{log.data.action.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs sm:text-sm">{log.data.targetUserId}</TableCell>
                <TableCell className="text-xs sm:text-sm">{log.data.performedBy}</TableCell>
                <TableCell className="text-xs sm:text-sm">
                  {new Date(log.data.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}