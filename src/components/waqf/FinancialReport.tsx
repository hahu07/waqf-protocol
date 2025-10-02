import React, { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import type { Waqf } from '@/types/waqfs';

interface FinancialReportProps {
  waqf: Waqf;
}

export const FinancialReport = React.memo(({ waqf }: FinancialReportProps) => {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const formattedValues = {
    totalDonations: formatCurrency(waqf.data.financial.totalDonations),
    totalDistributed: formatCurrency(waqf.data.financial.totalDistributed),
    currentBalance: formatCurrency(waqf.data.financial.currentBalance),
    investmentReturn: formatCurrency(waqf.data.financial.totalInvestmentReturn),
    completionRate: waqf.data.financial.impactMetrics?.completionRate 
      ? `${Math.round(waqf.data.financial.impactMetrics.completionRate * 100)}%` 
      : 'N/A'
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold sm:text-base">Financial Summary</h4>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {Object.entries(formattedValues).map(([key, value]) => (
          <div 
            key={key}
            className={`p-2 bg-gray-50 rounded sm:p-3 transition-transform ${
              activeCard === key ? 'scale-95' : ''
            }`}
            onTouchStart={() => setActiveCard(key)}
            onTouchEnd={() => setActiveCard(null)}
          >
            <div className="text-xs text-gray-600 sm:text-sm">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="text-sm font-semibold sm:text-base">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
});