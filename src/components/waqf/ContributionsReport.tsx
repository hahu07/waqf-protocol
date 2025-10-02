import React, { useState } from 'react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Waqf } from '@/types/waqfs';

interface ContributionsReportProps {
  waqf: Waqf;
}

export const ContributionsReport = React.memo(({ waqf }: ContributionsReportProps) => {
  const [isTouching, setIsTouching] = useState(false);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold sm:text-base">Contribution History</h4>
      <div className="max-h-60">
        <div className="flex overflow-x-auto touch-pan-x snap-x pb-2 scrollbar-hide">
          <div className="flex flex-nowrap gap-2">
            {waqf.data.waqfAssets.map((donation, index) => (
              <div
                key={index}
                className={`snap-start flex-shrink-0 w-[85vw] sm:w-full p-3 border rounded-lg transition-transform ${
                  isTouching ? 'scale-95' : ''
                }`}
                onTouchStart={() => setIsTouching(true)}
                onTouchEnd={() => setIsTouching(false)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs sm:text-sm">{formatDate(donation.date)}</div>
                    <div className={`text-xs capitalize ${
                      donation.status === 'completed' ? 'text-green-600' : 
                      donation.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {donation.status}
                    </div>
                  </div>
                  <div className="text-sm font-semibold sm:text-base">
                    {formatCurrency(donation.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});