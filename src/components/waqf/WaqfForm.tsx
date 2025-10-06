'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CausesModal } from './causesModal';
import type { WaqfProfile, Cause } from '@/types/waqfs';

interface BasicCause {
  id: string;
  name: string;
}

const convertBasicCauseToCause = (basicCause: BasicCause): Cause => ({
  id: basicCause.id,
  name: basicCause.name,
  description: '',
  icon: '❤️',
  category: 'general',
  isActive: true,
  sortOrder: 0,
  status: 'approved',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  followers: 0,
  fundsRaised: 0
});

interface WaqfFormData {
  name: string;
  donorName: string;
  donorEmail: string;
  description: string;
  initialCapital: number;
  selectedCauseIds: string[];
}

interface WaqfFormProps {
  initialData?: WaqfProfile;
  availableCauses: BasicCause[];
  isLoadingCauses?: boolean;
  causesError: Error | null;
  onSubmit: (data: Omit<WaqfProfile, 'id'>) => void;
}

export function WaqfForm({ 
  initialData, 
  availableCauses,
  isLoadingCauses = false,
  causesError,
  onSubmit 
}: WaqfFormProps) {
  const [formData, setFormData] = useState<WaqfFormData>({
    name: initialData?.name || '',
    donorName: initialData?.donor.name || '',
    donorEmail: initialData?.donor.email || '',
    description: initialData?.description || '',
    initialCapital: initialData?.initialCapital || 0,
    selectedCauseIds: initialData?.selectedCauses || []
  });
  
  const [showCausesModal, setShowCausesModal] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    donorName?: string;
    donorEmail?: string;
    description?: string;
    initialCapital?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    if (!formData.name.trim()) errors.name = 'Waqf name is required';
    if (!formData.donorName.trim()) errors.donorName = 'Donor name is required';
    if (!formData.donorEmail.trim()) {
      errors.donorEmail = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.donorEmail)) {
      errors.donorEmail = 'Please enter a valid email';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters';
    }
    if (formData.initialCapital <= 0) {
      errors.initialCapital = 'Initial capital must be greater than 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const waqfProfile: Omit<WaqfProfile, 'id'> = {
      name: formData.name,
      description: formData.description,
      initialCapital: formData.initialCapital,
      donor: {
        name: formData.donorName,
        email: formData.donorEmail,
        phone: '',
        address: ''
      },
      selectedCauses: formData.selectedCauseIds,
      causeAllocation: {},
      waqfAssets: [],
      supportedCauses: availableCauses
      .filter(c => formData.selectedCauseIds.includes(c.id))
      .map(convertBasicCauseToCause),
      financial: {
        totalDonations: 0,
        totalDistributed: 0,
        currentBalance: 0,
        investmentReturns: [],
        totalInvestmentReturn: 0,
        growthRate: 0,
        causeAllocations: {}
      },
      reportingPreferences: {
        frequency: 'yearly',
        reportTypes: ['financial'],
        deliveryMethod: 'email'
      },
      status: 'active',
      notifications: {
        contributionReminders: true,
        impactReports: true,
        financialUpdates: true
      },
      createdBy: '',
      createdAt: new Date().toISOString()
    };
    
    onSubmit(waqfProfile);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {causesError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Failed to load causes: {causesError.message}
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label>Selected Causes</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {formData.selectedCauseIds.length > 0 ? (
            formData.selectedCauseIds.map(id => {
              const cause = availableCauses.find(c => c.id === id);
              return cause ? (
                <span key={id} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {cause.name}
                </span>
              ) : null;
            })
          ) : (
            <p className="text-sm text-gray-500">No causes selected yet</p>
          )}
        </div>
        <Button 
          type="button" 
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setShowCausesModal(true)}
        >
          {formData.selectedCauseIds.length > 0 ? 'Edit Selection' : 'Select Causes'}
        </Button>
      </div>

      {showCausesModal && (
        <CausesModal
          isOpen={showCausesModal}
          causes={availableCauses.map(convertBasicCauseToCause)}
          isLoading={isLoadingCauses}
          error={causesError}
          selected={formData.selectedCauseIds}
          onClose={() => setShowCausesModal(false)}
          onCauseSelect={(ids) => setFormData({...formData, selectedCauseIds: ids})}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">
              Waqf Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={`w-full text-sm sm:text-base ${formErrors.name ? 'border-red-500' : ''}`}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialCapital" className="text-sm sm:text-base">
              Initial Capital ($)
            </Label>
            <Input
              id="initialCapital"
              type="number"
              min="1"
              step="0.01"
              value={formData.initialCapital}
              onChange={(e) => setFormData({...formData, initialCapital: parseFloat(e.target.value) || 0})}
              className={`w-full text-sm sm:text-base ${formErrors.initialCapital ? 'border-red-500' : ''}`}
            />
            {formErrors.initialCapital && (
              <p className="text-red-500 text-xs mt-1">{formErrors.initialCapital}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="donorName" className="text-sm sm:text-base">
              Donor Name
            </Label>
            <Input
              id="donorName"
              value={formData.donorName}
              onChange={(e) => setFormData({...formData, donorName: e.target.value})}
              className={`w-full text-sm sm:text-base ${formErrors.donorName ? 'border-red-500' : ''}`}
            />
            {formErrors.donorName && (
              <p className="text-red-500 text-xs mt-1">{formErrors.donorName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="donorEmail" className="text-sm sm:text-base">
              Donor Email
            </Label>
            <Input
              id="donorEmail"
              type="email"
              value={formData.donorEmail}
              onChange={(e) => setFormData({...formData, donorEmail: e.target.value})}
              className={`w-full text-sm sm:text-base ${formErrors.donorEmail ? 'border-red-500' : ''}`}
            />
            {formErrors.donorEmail && (
              <p className="text-red-500 text-xs mt-1">{formErrors.donorEmail}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm sm:text-base">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={`w-full min-h-[100px] text-sm sm:text-base ${formErrors.description ? 'border-red-500' : ''}`}
            />
            {formErrors.description && (
              <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button 
            type="submit" 
            className="w-full sm:w-auto min-h-[48px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}