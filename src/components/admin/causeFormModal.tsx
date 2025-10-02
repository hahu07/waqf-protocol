// components/admin/CauseFormModal.tsx - FOR ADMINS ONLY
import { useState, useEffect } from 'react';
import type { Cause } from "@/types/waqfs";
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '@junobuild/core';
import { v4 as uuidv4 } from 'uuid';

interface CauseFormModalProps {
  isOpen: boolean;
  cause?: Cause | null;
  onSave: (causeData: Omit<Cause, 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
  onDelete?: (causeId: string) => void; // Only for editing existing causes
}

export const CauseFormModal = ({ 
  isOpen, 
  cause, 
  onSave, 
  onClose,
  onDelete 
}: CauseFormModalProps) => {
  const [formData, setFormData] = useState<Omit<Cause, 'createdAt' | 'updatedAt'>>(() => ({
    id: cause?.id || '',
    name: cause?.name || '',
    description: cause?.description || '',
    icon: cause?.icon || '❤️',
    coverImage: cause?.coverImage || '',
    category: cause?.category || 'general',
    isActive: cause?.isActive ?? true,
    sortOrder: cause?.sortOrder || 0,
    status: cause?.status || 'approved',
    followers: cause?.followers || 0,
    fundsRaised: cause?.fundsRaised || 0
  }));

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Reset form data when modal opens or cause changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: cause?.id || '',
        name: cause?.name || '',
        description: cause?.description || '',
        icon: cause?.icon || '❤️',
        coverImage: cause?.coverImage || '',
        category: cause?.category || 'general',
        isActive: cause?.isActive ?? true,
        sortOrder: cause?.sortOrder || 0,
        status: cause?.status || 'approved',
        followers: cause?.followers || 0,
        fundsRaised: cause?.fundsRaised || 0
      });
      setErrors({});
      setIsSubmitting(false);
      setIsUploading(false);
    }
  }, [isOpen, cause]);

  const categories = [
    'education', 'healthcare', 'poverty', 'relief', 
    'religious', 'environment', 'community', 'general'
  ];

  const popularIcons = ['🎓', '🏥', '🤲', '🕌', '💧', '🌱', '👶', '👵', '📖', '🆘'];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await handleImageUpload(acceptedFiles[0]);
      }
    }
  });

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      console.log('Starting image upload:', file.name, file.type, file.size);
      
      const result = await uploadFile({
        collection: 'cause_images',
        data: file,
        filename: `cause_images/${uuidv4()}_${file.name}`
      } as const);

      console.log('Upload result:', result);

      if (!result?.downloadUrl) {
        throw new Error('Failed to get download URL');
      }

      console.log('Image uploaded successfully:', result.downloadUrl);

      // Insert markdown image syntax at cursor position
      const markdownImage = `![${file.name}](${result.downloadUrl})`;
      setFormData(prev => ({
        ...prev,
        description: `${prev.description}\n${markdownImage}\n`
      }));
      
      alert('Image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      console.log('Starting cover image upload:', file.name, file.type, file.size);
      
      const result = await uploadFile({
        collection: 'cause_images',
        data: file,
        filename: `cause_covers/${uuidv4()}_${file.name}`
      } as const);

      console.log('Cover upload result:', result);

      if (!result?.downloadUrl) {
        throw new Error('Failed to get download URL');
      }

      console.log('Cover image uploaded successfully:', result.downloadUrl);

      // Set cover image URL
      setFormData(prev => ({
        ...prev,
        coverImage: result.downloadUrl
      }));
      
      alert('Cover image uploaded successfully!');
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert(`Failed to upload cover image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Cause name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Cause name must be at least 3 characters';
    }

    // Description validation - check plain text length
    const plainText = formData.description.replace(/[#*_~`\[\]]/g, '');
    if (!plainText.trim()) {
      newErrors.description = 'Description is required';
    } else if (plainText.length < 20) {
      newErrors.description = 'Description must contain at least 20 characters of meaningful content';
    } else if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    // Sort order validation
    if (formData.sortOrder < 0) {
      newErrors.sortOrder = 'Sort order cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (cause && onDelete) {
      if (window.confirm(`Are you sure you want to delete "${cause.name}"? This action cannot be undone.`)) {
        onDelete(cause.name); // Using cause name as ID
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Gradient Header */}
        <div className="p-6 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, #2563eb, #9333ea)' }}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {cause ? '✏️ Edit Cause' : '✨ Create New Cause'}
              </h2>
              <p className="text-blue-100 text-sm">
                {cause ? 'Update cause details and settings' : 'Add a new charitable cause to the platform'}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cause Name */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                🎯 Cause Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all ${
                  errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:bg-white'
                }`}
                placeholder="e.g., Education Support for Orphans"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
            </div>

            {/* Cover Image Upload */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-100">
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                🖼️ Cover Image (Optional)
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Upload a cover image for this cause. This will be displayed prominently on cause cards.
              </p>
              
              {formData.coverImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border-2 border-purple-200 shadow-md">
                    <img 
                      src={formData.coverImage} 
                      alt="Cover preview" 
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove cover image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverImageUpload(file);
                    }}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-500 hover:bg-purple-50/50 transition-all">
                    <div className="text-4xl mb-3">{isUploading ? '⏳' : '🖼️'}</div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {isUploading ? 'Uploading...' : 'Click to upload cover image'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPEG, JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  📝 Description *
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                      {isUploading ? '⏳ Uploading...' : '🖼️ Add Image'}
                    </span>
                  </label>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                    formData.description.length > 4500 ? 'bg-red-100 text-red-700' :
                    formData.description.length > 4000 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {formData.description.length}/5000
                  </span>
                </div>
              </div>
              <div className={`border-2 rounded-xl overflow-hidden transition-all ${
                errors.description ? 'border-red-500 ring-4 ring-red-100' : 'border-gray-200 hover:border-gray-300'
              }`} data-color-mode="light">
                <MDEditor
                  value={formData.description}
                  onChange={(value = '') => setFormData(prev => ({ ...prev, description: value }))}
                  previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
                  height={250}
                  commands={[
                    {
                      name: 'uploadImage',
                      icon: (
                        <div 
                          {...getRootProps()} 
                          className="p-1 cursor-pointer hover:bg-blue-50 rounded transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <input {...getInputProps()} />
                          <span title={isUploading ? 'Uploading...' : 'Upload image'} className="inline-block">
                            {isUploading ? '⏳' : '🖼️'}
                          </span>
                        </div>
                      ),
                      execute: () => {}
                    }
                  ]}
                />
              </div>
              {errors.description && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span>⚠️</span> {errors.description}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-2 bg-blue-50 px-3 py-2 rounded-lg flex items-start gap-2 border border-blue-100">
                <span>💡</span>
                <span>
                  <strong>Two ways to add images:</strong><br/>
                  1. <strong>Dedicated Cover:</strong> Use the Cover Image section above for the main cause image<br/>
                  2. <strong>In Description:</strong> Click '🖼️ Add Image' button or drag & drop images here
                </span>
              </p>
              {isDragActive && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 pointer-events-none backdrop-blur-sm">
                  <div className="bg-white p-10 rounded-2xl text-center shadow-2xl">
                    <div className="text-6xl mb-4">🖼️</div>
                    <p className="text-xl font-bold text-gray-900 mb-2">Drop Image Here</p>
                    <p className="text-gray-600">Release to upload</p>
                  </div>
                </div>
              )}
            </div>

            {/* Icon Selection */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-5 rounded-xl border-2 border-blue-100">
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                🎨 Cause Icon
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-16 h-16 bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center text-3xl shadow-sm">
                    {formData.icon || '❓'}
                  </div>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white"
                    placeholder="Enter emoji or leave blank"
                    maxLength={2}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">🎯 Popular Icons:</p>
                  <div className="flex flex-wrap gap-2">
                    {popularIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          formData.icon === icon 
                            ? 'bg-white border-blue-500 shadow-lg scale-110 ring-4 ring-blue-100' 
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-105'
                        }`}
                        title={`Select ${icon}`}
                      >
                        <span className="text-2xl">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  📋 Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Approval Status */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  ✅ Approval Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'pending' | 'approved' | 'rejected' }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white"
                >
                  <option value="approved">✅ Approved</option>
                  <option value="pending">⏳ Pending Review</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
              </div>
            </div>

            {/* Active Status and Sort Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-5 w-5 text-blue-600 focus:ring-4 focus:ring-blue-100 rounded border-2 border-gray-300"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-700 block">
                      {formData.isActive ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formData.isActive ? 'Visible to users' : 'Hidden from users'}
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  🔢 Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all ${
                    errors.sortOrder ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}
                  min="0"
                  placeholder="0"
                />
                {errors.sortOrder ? (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <span>⚠️</span> {errors.sortOrder}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">💡 Lower numbers appear first</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6 -mx-6 px-6 -mb-6 pb-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                {cause && onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Cause
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 hover:border-gray-400"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className={`flex-1 px-6 py-3 text-white rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    isSubmitting || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5'
                  }`}
                  style={{ background: isSubmitting || isUploading ? '#9ca3af' : 'linear-gradient(to right, #2563eb, #9333ea)' }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : isUploading ? (
                    <>
                      ⏳ Uploading Image...
                    </>
                  ) : (
                    <>
                      {cause ? '✅ Update Cause' : '✨ Create Cause'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CauseFormModal;