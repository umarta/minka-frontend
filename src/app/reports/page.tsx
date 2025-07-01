'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, Users, MessageSquare, Clock, DollarSign, Target } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAnalyticsStore } from '@/lib/stores/analytics';
import { DateRange } from '@/types';
import { format, subDays, subMonths, subWeeks } from 'date-fns';
import { OverviewCards } from '@/components/reports/overview-cards';
import { MessageVolumeChart } from '@/components/reports/message-volume-chart';
import { ResponseTimeChart } from '@/components/reports/response-time-chart';
import { AgentPerformanceChart } from '@/components/reports/agent-performance-chart';
import { CustomerSatisfactionChart } from '@/components/reports/customer-satisfaction-chart';
import { RevenueChart } from '@/components/reports/revenue-chart';
import { TopContactsTable } from '@/components/reports/top-contacts-table';
import { ReportsFilters } from '@/components/reports/reports-filters';

const dateRangeOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last year', value: '1y' },
  { label: 'Custom', value: 'custom' },
];

export default function ReportsPage() {
  const {
    overview,
    messageVolume,
    responseTime,
    agentPerformance,
    customerSatisfaction,
    revenue,
    topContacts,
    isLoading,
    error,
    dateRange,
    fetchOverview,
    fetchMessageVolume,
    fetchResponseTime,
    fetchAgentPerformance,
    fetchCustomerSatisfaction,
    fetchRevenue,
    fetchTopContacts,
    setDateRange,
    exportReport,
    clearError
  } = useAnalyticsStore();

  const [selectedRange, setSelectedRange] = useState('30d');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const range = getDateRangeFromSelection(selectedRange);
    setDateRange(range);
    
    // Fetch all analytics data
    fetchAllData(range);
  }, [selectedRange]);

  const getDateRangeFromSelection = (selection: string): DateRange => {
    const now = new Date();
    
    switch (selection) {
      case '7d':
        return { from: subDays(now, 7), to: now };
      case '30d':
        return { from: subDays(now, 30), to: now };
      case '3m':
        return { from: subMonths(now, 3), to: now };
      case '6m':
        return { from: subMonths(now, 6), to: now };
      case '1y':
        return { from: subMonths(now, 12), to: now };
      default:
        return { from: subDays(now, 30), to: now };
    }
  };

  const fetchAllData = async (range: DateRange) => {
    try {
      await Promise.all([
        fetchOverview(range),
        fetchMessageVolume(range),
        fetchResponseTime(range),
        fetchAgentPerformance(range),
        fetchCustomerSatisfaction(range),
        fetchRevenue(range),
        fetchTopContacts(range),
      ]);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      await exportReport(format, dateRange);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">
              Monitor performance and track key metrics for your customer service operations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedRange} onValueChange={setSelectedRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Display */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading analytics data...</p>
          </div>
        )}

        {/* Overview Cards */}
        <OverviewCards data={overview} isLoading={isLoading} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message Volume */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message Volume
                </CardTitle>
                <Badge variant="outline">Daily</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <MessageVolumeChart data={messageVolume} isLoading={isLoading} />
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Response Time
                </CardTitle>
                <Badge variant="outline">Average</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponseTimeChart data={responseTime} isLoading={isLoading} />
            </CardContent>
          </Card>

          {/* Agent Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Agent Performance
                </CardTitle>
                <Badge variant="outline">This Month</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AgentPerformanceChart data={agentPerformance} isLoading={isLoading} />
            </CardContent>
          </Card>

          {/* Customer Satisfaction */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Customer Satisfaction
                </CardTitle>
                <Badge variant="outline">CSAT Score</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CustomerSatisfactionChart data={customerSatisfaction} isLoading={isLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart - Full Width */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Analytics
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Monthly</Badge>
                <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Contacts */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Active Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopContactsTable data={topContacts} isLoading={isLoading} />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Peak Hours */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Peak Hours</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>9:00 AM - 11:00 AM</span>
                    <Badge variant="secondary">High</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>2:00 PM - 4:00 PM</span>
                    <Badge variant="secondary">Medium</Badge>
                  </div>
                </div>
              </div>

              {/* Top Categories */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Top Categories</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Support</span>
                    <span className="text-gray-500">45%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Sales</span>
                    <span className="text-gray-500">30%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Billing</span>
                    <span className="text-gray-500">25%</span>
                  </div>
                </div>
              </div>

              {/* SLA Performance */}
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">SLA Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span>On Time</span>
                    <Badge variant="default" className="bg-green-500">
                      92%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Breached</span>
                    <Badge variant="destructive">
                      8%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <ReportsFilters
            onFiltersChange={(filters) => {
              // Apply filters and refetch data
              fetchAllData(dateRange);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
} 