import React, { useState } from 'react';
import type { Waqf } from '@/types/waqfs';

interface ImpactReportProps {
  waqf: Waqf;
}

export const ImpactReport = React.memo(({ waqf }: ImpactReportProps) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const impactMetrics = waqf.data.financial?.impactMetrics;
  
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold sm:text-base">Impact Summary</h4>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div 
          className={`p-2 bg-gray-50 rounded sm:p-3 transition-transform ${
            activeCard === 'causes' ? 'scale-95' : ''
          }`}
          onTouchStart={() => setActiveCard('causes')}
          onTouchEnd={() => setActiveCard(null)}
        >
          <div className="text-xs text-gray-600 sm:text-sm">Causes Supported</div>
          <div className="text-sm font-semibold sm:text-base">
            {waqf.data.supportedCauses.length}
          </div>
        </div>
        
        {impactMetrics && (
          <>
            <div 
              className={`p-2 bg-gray-50 rounded sm:p-3 transition-transform ${
                activeCard === 'beneficiaries' ? 'scale-95' : ''
              }`}
              onTouchStart={() => setActiveCard('beneficiaries')}
              onTouchEnd={() => setActiveCard(null)}
            >
              <div className="text-xs text-gray-600 sm:text-sm">Beneficiaries Reached</div>
              <div className="text-sm font-semibold sm:text-base">
                {impactMetrics.beneficiariesSupported?.toLocaleString() ?? 'N/A'}
              </div>
            </div>
            <div 
              className={`p-2 bg-gray-50 rounded sm:p-3 transition-transform ${
                activeCard === 'projects' ? 'scale-95' : ''
              }`}
              onTouchStart={() => setActiveCard('projects')}
              onTouchEnd={() => setActiveCard(null)}
            >
              <div className="text-xs text-gray-600 sm:text-sm">Projects Funded</div>
              <div className="text-sm font-semibold sm:text-base">
                {impactMetrics.projectsCompleted ?? 'N/A'}
              </div>
            </div>
            <div 
              className={`p-2 bg-gray-50 rounded sm:p-3 transition-transform ${
                activeCard === 'completion' ? 'scale-95' : ''
              }`}
              onTouchStart={() => setActiveCard('completion')}
              onTouchEnd={() => setActiveCard(null)}
            >
              <div className="text-xs text-gray-600 sm:text-sm">Completion Rate</div>
              <div className="text-sm font-semibold sm:text-base">
                {impactMetrics.completionRate ? `${Math.round(impactMetrics.completionRate * 100)}%` : 'N/A'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
});