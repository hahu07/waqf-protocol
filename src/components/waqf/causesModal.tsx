'use client';

import { Dialog, DialogTitle } from '@headlessui/react';
import type { Cause } from '@/types/waqfs';

type CausesModalProps = {
  isOpen: boolean;
  causes: Cause[];
  isLoading: boolean;
  error: Error | null;
  selected: string[];
  onClose: () => void;
  onCauseSelect: (causeIds: string[]) => void;
};

export function CausesModal({
  isOpen,
  causes,
  isLoading,
  error,
  selected,
  onClose,
  onCauseSelect
}: CausesModalProps) {
  console.log('🗨️ CausesModal rendering:', { isOpen, causesCount: causes.length, isLoading, error, causes });
  
  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      className="relative z-50"
      aria-labelledby="causes-modal-title"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-2 z-50">
        <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <DialogTitle as="h2" className="text-xl font-bold mb-4 dark:text-white">
            Select Causes
          </DialogTitle>
          
          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading causes...</p>
            </div>
          ) : error ? (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
              <div className="text-red-700 dark:text-red-300 font-medium mb-2">
                Failed to load causes
              </div>
              <p className="text-red-600 dark:text-red-300 text-sm mb-3">{error.message}</p>
              <button
                onClick={() => onCauseSelect([])}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="w-full max-h-[90vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-3">
                {causes.map(cause => (
                  <div 
                    key={cause.id} 
                    className="flex items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id={`cause-${cause.id}`}
                      checked={selected.includes(cause.id)}
                      onChange={() => {
                        const newSelection = selected.includes(cause.id)
                          ? selected.filter(id => id !== cause.id)
                          : [...selected, cause.id];
                        onCauseSelect(newSelection);
                      }}
                      className="mt-1 mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      aria-labelledby={`cause-label-${cause.id}`}
                    />
                    <label 
                      id={`cause-label-${cause.id}`}
                      htmlFor={`cause-${cause.id}`}
                      className="flex-1"
                    >
                      <span className="font-medium dark:text-white">{cause.name}</span>
                      {cause.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                          {cause.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {cause.category}
                        </span>
                        <span 
                          className={`px-2 py-0.5 rounded-full ${
                            cause.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {cause.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
