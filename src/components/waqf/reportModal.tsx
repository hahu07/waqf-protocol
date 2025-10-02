// components/waqf/ReportModal.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Waqf } from '@/types/waqfs';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Dialog, DialogTitle } from '@headlessui/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialReport } from './FinancialReport';
import { ImpactReport } from './ImpactReport';
import { ContributionsReport } from './ContributionsReport';

type ReportType = 'financial' | 'impact' | 'contributions';
const REPORT_TYPES: ReportType[] = ['financial', 'impact', 'contributions'];

interface PDFExportOptions {
  waqf: Waqf;
  reportType: ReportType;
  watermarkText?: string;
  signatureRequired?: boolean;
}

const exportToPDF = (options: PDFExportOptions): Promise<void> => {
  const { waqf, reportType, watermarkText = 'CONFIDENTIAL', signatureRequired = false } = options;
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();

      // PDF configuration
      autoTable(doc, {
        styles: {
          fillColor: [23, 107, 135],
          textColor: [255, 255, 255],
          fontSize: 10,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [50, 50, 50],
          textColor: [255, 255, 255],
          fontSize: 11,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { top: 45 },
      });

      // Header
      doc.setFillColor(23, 107, 135);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Juno Waqf Platform', 14, 15);
      
      // Watermark
      doc.setFontSize(40);
      doc.setTextColor(230, 230, 230);
      doc.text(watermarkText, 40, 150, { angle: 45 });
      doc.setTextColor(0, 0, 0);

      // Report title
      doc.setFontSize(18);
      doc.text(`Waqf Report - ${waqf.data.donor.name}`, 14, 35);
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 40, 190, 40);

      // Report content
      switch(reportType) {
        case 'financial':
          doc.text('Financial Summary', 14, 50);
          autoTable(doc, {
            startY: 55,
            head: [['Metric', 'Value']],
            body: [
              ['Total Donations', formatCurrency(waqf.data.financial.totalDonations)],
              ['Total Distributed', formatCurrency(waqf.data.financial.totalDistributed)],
              ['Current Balance', formatCurrency(waqf.data.financial.currentBalance)],
              ['Investment Returns', formatCurrency(waqf.data.financial.totalInvestmentReturn)],
              ['Completion Rate', waqf.data.financial.impactMetrics?.completionRate ? `${Math.round(waqf.data.financial.impactMetrics.completionRate * 100)}%` : 'N/A']
            ],
          });
          break;
        case 'impact':
          doc.text('Impact Summary', 14, 50);
          autoTable(doc, {
            startY: 55,
            head: [['Metric', 'Value']],
            body: [
              ['Causes Supported', waqf.data.supportedCauses.length.toString()],
              ['Beneficiaries Reached', waqf.data.financial.impactMetrics?.beneficiariesSupported?.toLocaleString() || 'N/A'],
              ['Projects Funded', waqf.data.financial.impactMetrics?.projectsCompleted?.toString() || 'N/A'],
              ['Completion Rate', waqf.data.financial.impactMetrics?.completionRate ? `${Math.round(waqf.data.financial.impactMetrics.completionRate * 100)}%` : 'N/A']
            ],
          });
          break;
        case 'contributions':
          doc.text('Contribution History', 14, 50);
          autoTable(doc, {
            startY: 55,
            head: [['Date', 'Amount', 'Status']],
            body: waqf.data.waqfAssets.map(donation => [
              formatDate(donation.date),
              formatCurrency(donation.amount),
              donation.status
            ]),
          });
          break;
      }

      if (signatureRequired) {
        doc.setFontSize(12);
        doc.text('Authorized Signature:', 14, 260);
        doc.line(60, 260, 120, 260);
      }

      doc.save(`waqf-report-${waqf.data.donor.name}-${date}.pdf`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

interface ReportModalProps {
  waqf: Waqf | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const ReportModal = ({ waqf, isOpen, onClose, isLoading = false }: ReportModalProps) => {
  const [reportType, setReportType] = useState<ReportType>('financial');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [touchActive, setTouchActive] = useState(false);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const handleExportPDF = async () => {
    const isMobile = window.innerWidth < 640;
    if (!waqf) return;
    
    setIsGeneratingPDF(true);
    setPdfError(null);
    
    try {
      await exportToPDF({
        waqf,
        reportType,
       watermarkText: isMobile ? '' : 'CONFIDENTIAL',
      signatureRequired: !isMobile && reportType === 'financial'
      });
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'PDF generation failed');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div className="relative w-full max-w-full sm:max-w-md md:max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {pdfError && (
            <div className="p-2 text-xs bg-red-100 text-red-700 sm:text-sm sm:p-3" role="alert">
              {pdfError}
            </div>
          )}

          <div className="p-3 space-y-3 sm:p-4 sm:space-y-4">
            <div className="flex items-center justify-between">
              <DialogTitle as="h2" className="text-lg font-semibold sm:text-xl">
                {isLoading ? 'Loading Report...' : `Waqf Report - ${waqf?.data.donor.name || ''}`}
              </DialogTitle>
              <button
                ref={initialFocusRef}
                onClick={onClose}
                className="p-1 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
              {REPORT_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`px-3 py-1 text-sm capitalize rounded sm:text-base sm:px-4 sm:py-2
                    ${reportType === type 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}
                    active:scale-95 transition-transform`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : waqf ? (
                <>
                  {reportType === 'financial' && <FinancialReport waqf={waqf} />}
                  {reportType === 'impact' && <ImpactReport waqf={waqf} />}
                  {reportType === 'contributions' && <ContributionsReport waqf={waqf} />}
                </>
              ) : (
                <div className="py-4 text-center text-red-500">
                  Failed to load waqf data
                </div>
              )}
            </div>

            <button
              onClick={handleExportPDF}
              onTouchStart={() => setTouchActive(true)}
              onTouchEnd={() => setTouchActive(false)}
              disabled={isGeneratingPDF || !waqf}
              className={`w-full py-2 text-sm font-medium text-white rounded sm:text-base
                ${isGeneratingPDF ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}
                ${touchActive ? 'scale-95' : ''} transition-transform duration-100`}
            >
              {isGeneratingPDF ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating PDF...
                </span>
              ) : (
                'Export Report'
              )}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};