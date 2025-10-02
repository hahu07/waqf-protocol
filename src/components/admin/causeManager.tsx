// components/admin/CauseManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Cause, CauseDoc } from "@/types/waqfs";
import { CauseFormModal } from './causeFormModal';
import type { AdminManagerProps } from './types';
import { listCauses, createCause, updateCause, deleteCause } from '@/lib/cause-utils';
import ReactMarkdown from 'react-markdown';

export function CauseManager({ 
  showHeader = true,
  headerTitle = 'Cause Management'
}: AdminManagerProps) {
  const { isAdmin } = useAuth();
  const [causes, setCauses] = useState<CauseDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCause, setEditingCause] = useState<CauseDoc | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCauses = async () => {
    try {
      setLoading(true);
      setError(null);
      const causes = await listCauses();
      // Convert to CauseDoc format for compatibility
      const causeDocs: CauseDoc[] = causes.map(cause => ({
        key: cause.id,
        data: cause,
        created_at: BigInt(new Date(cause.createdAt).getTime() * 1000000),
        updated_at: BigInt(new Date(cause.updatedAt).getTime() * 1000000),
        version: BigInt(1)
      }));
      setCauses(causeDocs);
    } catch (error) {
      console.error('Error loading causes:', error);
      setError('Failed to load causes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCauses();
  }, []);

  const handleSaveCause = async (causeData: Omit<Cause, 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingCause) {
        // Update existing cause
        await updateCause(editingCause.key, causeData);
      } else {
        // Create new cause
        await createCause(causeData);
      }

      await loadCauses();
      setShowForm(false);
      setEditingCause(null);
    } catch (error) {
      console.error('Error saving cause:', error);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      setDeletingId(key);
      await deleteCause(key);
      await loadCauses();
    } catch (error) {
      console.error('Error deleting cause:', error);
      setDeleteError('Failed to delete cause. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Admin privileges required</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2563eb, #9333ea)' }}>
          <span className="text-4xl">🎯</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Causes Yet</h3>
        <p className="text-gray-600 mb-6">Start by creating your first charitable cause</p>
        <button
          onClick={() => setShowForm(true)}
          className="px-8 py-3 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)' }}
        >
          ✨ Create First Cause
        </button>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="bg-white rounded-xl shadow-lg border border-red-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Causes</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={loadCauses}
          className="px-8 py-3 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)' }}
        >
          🔄 Retry
        </button>
      </div>
    </div>
  );

  const renderCausesList = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Causes Management</h1>
            <p className="text-gray-600">Manage charitable causes and approve new submissions</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)' }}
          >
            ✨ Add New Cause
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-900 mb-1">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-900 mb-1">Delete Error</p>
            <p className="text-sm text-red-700">{deleteError}</p>
          </div>
        </div>
      )}
      
      {/* Causes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {causes.map((cause) => (
          <div key={cause.key} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Cover Image */}
            {cause.data.coverImage && (
              <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                <img 
                  src={cause.data.coverImage} 
                  alt={cause.data.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-2xl">{cause.data.icon}</span>
                </div>
              </div>
            )}
            
            {/* Card Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-4 mb-3">
                {!cause.data.coverImage && (
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #9333ea)' }}
                  >
                    {cause.data.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg mb-2 truncate">{cause.data.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      cause.data.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {cause.data.isActive ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      cause.data.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      cause.data.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {cause.data.status === 'approved' ? '✔️ Approved' :
                       cause.data.status === 'pending' ? '⏳ Pending' :
                       '❌ Rejected'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 line-clamp-3 leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    img: ({node, ...props}) => (
                      <img {...props} className="rounded-lg max-w-full h-auto my-2" alt={props.alt || ''} />
                    ),
                    p: ({node, ...props}) => <p {...props} className="mb-2" />
                  }}
                >
                  {cause.data.description}
                </ReactMarkdown>
              </div>
            </div>
            
            {/* Card Footer */}
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{cause.data.followers || 0}</span> followers
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCause(cause);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(cause.key)}
                  disabled={deletingId === cause.key}
                  className={`px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-colors text-sm ${
                    deletingId === cause.key ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {deletingId === cause.key ? '⏳ Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );

  return (
    <>
      {error && !loading ? renderErrorState() :
       !loading && causes.length === 0 ? renderEmptyState() :
       renderCausesList()}
      
      {showForm && (
        <CauseFormModal
          isOpen={showForm}
          cause={editingCause?.data}
          onSave={handleSaveCause}
          onClose={() => {
            setShowForm(false);
            setEditingCause(null);
          }}
        />
      )}
    </>
  );
}
