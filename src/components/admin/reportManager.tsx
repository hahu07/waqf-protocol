// src/components/admin/reportManager.tsx
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { ReportModal } from '@/components/waqf/reportModal';
import { useState, useMemo } from 'react';
import type { Waqf } from '@/types/waqfs';
import type { AdminManagerProps } from './types';
import { useFetchWaqfData } from '@/hooks/useWaqfData';
import { FaChartLine, FaHandHoldingHeart, FaDollarSign, FaUsers, FaFileAlt, FaDownload, FaArrowUp, FaArrowDown, FaCalendarAlt, FaCheckCircle, FaClock, FaArrowRight } from 'react-icons/fa';

interface WaqfReport {
  id: string;
  data: Waqf;
}

export function ReportManager({ 
  showHeader = true,
  headerTitle = 'System Reports'
}: AdminManagerProps) {
  const { isAdmin } = useAuth();
  const [selectedWaqf, setSelectedWaqf] = useState<Waqf | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState<'financial' | 'impact' | 'contributions' | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'all'>('month');
  
  // Get raw data from hook
  const { waqfs: waqfProfiles, statistics, loading } = useFetchWaqfData();
  
  // Convert WaqfProfile[] to Waqf[]
  const waqfs = useMemo(() => 
    waqfProfiles.map(profile => ({
      key: profile.id,
      data: profile
    })),
    [waqfProfiles]
  );

  const handleViewReport = (type: 'financial' | 'impact' | 'contributions') => {
    setReportType(type);
    if (waqfs.length > 0) {
      setSelectedWaqf(waqfs[0]);
      setShowReport(true);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const reportCards = [
    {
      title: 'Financial Report',
      description: 'Comprehensive financial overview and analytics',
      icon: <FaDollarSign className="w-6 h-6" />,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      type: 'financial' as const,
      stats: {
        label: 'Total Donations',
        value: `$${(statistics?.totalDonations || 0).toLocaleString()}`,
      },
    },
    {
      title: 'Impact Report',
      description: 'Measure cause impact and beneficiary reach',
      icon: <FaHandHoldingHeart className="w-6 h-6" />,
      gradient: 'linear-gradient(135deg, #2563eb, #9333ea)',
      type: 'impact' as const,
      stats: {
        label: 'Beneficiaries',
        value: (statistics?.beneficiaries || 0).toLocaleString(),
      },
    },
    {
      title: 'Contributions',
      description: 'Donation analytics and contributor insights',
      icon: <FaChartLine className="w-6 h-6" />,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      type: 'contributions' as const,
      stats: {
        label: 'Active Waqfs',
        value: (statistics?.totalWaqfs || 0).toLocaleString(),
      },
    },
    {
      title: 'User Analytics',
      description: 'Platform usage and user engagement metrics',
      icon: <FaUsers className="w-6 h-6" />,
      gradient: 'linear-gradient(135deg, #9333ea, #4338ca)',
      type: null,
      stats: {
        label: 'Active Causes',
        value: (statistics?.activeCauses || 0).toLocaleString(),
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {headerTitle}
            </h1>
            <p className="text-gray-600">Comprehensive analytics and reporting dashboard</p>
          </div>
          <button
            className="px-6 py-3 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
            style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)' }}
          >
            <FaDownload className="w-4 h-4" />
            Export All Reports
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCards.map((card, index) => (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
            onClick={() => card.type && handleViewReport(card.type)}
          >
            <div className="p-6">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: card.gradient }}
              >
                {card.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{card.description}</p>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">{card.stats.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.stats.value}</p>
              </div>
            </div>
            {card.type && (
              <div className="px-6 py-3 bg-gray-50 flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">View Details</span>
                <FaFileAlt className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FaChartLine className="w-5 h-5 text-blue-600" />
            Platform Overview
          </h2>
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="w-4 h-4 text-gray-400" />
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-900 font-medium">Total Waqfs</p>
              <FaArrowUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{statistics?.totalWaqfs || 0}</p>
            <p className="text-xs text-blue-700 mt-1">+12% from last period</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-900 font-medium">Active Causes</p>
              <FaCheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{statistics?.activeCauses || 0}</p>
            <p className="text-xs text-green-700 mt-1">+8% from last period</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-purple-900 font-medium">Beneficiaries</p>
              <FaUsers className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{statistics?.beneficiaries || 0}</p>
            <p className="text-xs text-purple-700 mt-1">+15% from last period</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-yellow-900 font-medium">Donations</p>
              <FaDollarSign className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-900">${(statistics?.totalDonations || 0).toLocaleString()}</p>
            <p className="text-xs text-yellow-700 mt-1">+23% from last period</p>
          </div>
        </div>
      </div>

      {/* Recent Activity & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Waqfs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaArrowUp className="w-5 h-5 text-green-600" />
            Top Performing Waqfs
          </h3>
          <div className="space-y-3">
            {waqfProfiles.slice(0, 5).map((waqf, index) => (
              <div key={waqf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{waqf.description || 'Waqf ' + (index + 1)}</p>
                    <p className="text-xs text-gray-500">{waqf.selectedCauses?.length || 0} causes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">$0</p>
                  <p className="text-xs text-gray-500">raised</p>
                </div>
              </div>
            ))}
            {waqfProfiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FaClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No waqfs available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaClock className="w-5 h-5 text-blue-600" />
            Recent Activities
          </h3>
          <div className="space-y-3">
            {[
              { action: 'New Donation', detail: 'Received $500 for Education Waqf', time: '5 min ago', icon: FaDollarSign, color: 'green' },
              { action: 'Waqf Created', detail: 'Clean Water Initiative launched', time: '1 hour ago', icon: FaHandHoldingHeart, color: 'blue' },
              { action: 'Report Generated', detail: 'Monthly financial report completed', time: '2 hours ago', icon: FaFileAlt, color: 'purple' },
              { action: 'Cause Updated', detail: 'Healthcare program milestone reached', time: '3 hours ago', icon: FaCheckCircle, color: 'indigo' },
              { action: 'New Admin', detail: 'Admin user added to platform', time: '5 hours ago', icon: FaUsers, color: 'orange' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                <div className={`w-10 h-10 rounded-full bg-${activity.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <activity.icon className={`w-4 h-4 text-${activity.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600 truncate">{activity.detail}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
                <FaArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {selectedWaqf && showReport && (
        <ReportModal
          waqf={{ ...selectedWaqf }}
          isOpen={showReport}
          onClose={() => {
            setShowReport(false);
            setSelectedWaqf(null);
            setReportType(null);
          }}
        />
      )}
    </div>
  );
}
