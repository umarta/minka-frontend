'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  MessageSquare,
  Star,
  Calendar,
  Download,
  Filter,
  Eye,
  Zap
} from 'lucide-react';
import { QuickReplyTemplate } from '@/types';

interface UsageAnalyticsProps {
  templates: QuickReplyTemplate[];
}

interface AnalyticsData {
  totalTemplates: number;
  totalUsage: number;
  averageUsage: number;
  mostUsedTemplate: QuickReplyTemplate | null;
  leastUsedTemplate: QuickReplyTemplate | null;
  categoryStats: { category: string; count: number; usage: number }[];
  recentlyCreated: QuickReplyTemplate[];
  topPerformers: QuickReplyTemplate[];
  underperformers: QuickReplyTemplate[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';
type MetricType = 'usage' | 'creation' | 'performance';

export function UsageAnalytics({ templates }: UsageAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('usage');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate analytics data
  const analyticsData = useMemo((): AnalyticsData => {
    const filteredTemplates = selectedCategory === 'all' 
      ? templates 
      : templates.filter(t => t.category === selectedCategory);

    const totalUsage = filteredTemplates.reduce((sum, t) => sum + t.usage_count, 0);
    const averageUsage = filteredTemplates.length > 0 ? totalUsage / filteredTemplates.length : 0;

    // Sort by usage for most/least used
    const sortedByUsage = [...filteredTemplates].sort((a, b) => b.usage_count - a.usage_count);
    
    // Category statistics
    const categoryMap = new Map<string, { count: number; usage: number }>();
    filteredTemplates.forEach(template => {
      const category = template.category || 'Uncategorized';
      const existing = categoryMap.get(category) || { count: 0, usage: 0 };
      categoryMap.set(category, {
        count: existing.count + 1,
        usage: existing.usage + template.usage_count
      });
    });

    const categoryStats = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      ...stats
    })).sort((a, b) => b.usage - a.usage);

    // Recently created (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyCreated = filteredTemplates
      .filter(t => new Date(t.created_at) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Top performers (high usage)
    const topPerformers = sortedByUsage.slice(0, 5);

    // Underperformers (low usage, but not zero)
    const underperformers = sortedByUsage
      .filter(t => t.usage_count > 0)
      .slice(-5)
      .reverse();

    return {
      totalTemplates: filteredTemplates.length,
      totalUsage,
      averageUsage,
      mostUsedTemplate: sortedByUsage[0] || null,
      leastUsedTemplate: sortedByUsage[sortedByUsage.length - 1] || null,
      categoryStats,
      recentlyCreated,
      topPerformers,
      underperformers
    };
  }, [templates, selectedCategory]);

  const categories = Array.from(new Set(templates.map(t => t.category))).filter(Boolean);

  const handleExportAnalytics = () => {
    const exportData = {
      analytics: analyticsData,
      filters: {
        timeRange,
        category: selectedCategory,
        metric: selectedMetric
      },
      exportDate: new Date().toISOString(),
      templates: templates.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-reply-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend, 
    trendValue 
  }: {
    title: string;
    value: string | number;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={`text-xs ${
                  trend === 'up' ? 'text-green-600' : 
                  trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Usage Analytics</h2>
          <p className="text-sm text-gray-600">
            Insights and statistics about your quick reply templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Templates"
          value={analyticsData.totalTemplates}
          description="Active templates"
          icon={MessageSquare}
        />
        <StatCard
          title="Total Usage"
          value={analyticsData.totalUsage.toLocaleString()}
          description="Times templates were used"
          icon={BarChart3}
          trend="up"
          trendValue="+12% from last month"
        />
        <StatCard
          title="Average Usage"
          value={analyticsData.averageUsage.toFixed(1)}
          description="Uses per template"
          icon={TrendingUp}
        />
        <StatCard
          title="Categories"
          value={analyticsData.categoryStats.length}
          description="Template categories"
          icon={Filter}
        />
      </div>

      <Tabs value={selectedMetric} onValueChange={value => setSelectedMetric(value as MetricType)}>
        <TabsList>
          <TabsTrigger value="usage">Usage Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="creation">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedMetric} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Category Performance</CardTitle>
                <CardDescription>
                  Usage statistics by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.categoryStats.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No category data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analyticsData.categoryStats.map((stat, index) => (
                      <div key={stat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-blue-500' :
                            index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium">{stat.category}</span>
                          <Badge variant="secondary" className="text-xs">
                            {stat.count} templates
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{stat.usage}</p>
                          <p className="text-xs text-gray-500">uses</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Most vs Least Used */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Usage Extremes</CardTitle>
                <CardDescription>
                  Most and least used templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.mostUsedTemplate && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Most Used</span>
                    </div>
                    <p className="text-sm text-green-700 font-medium">
                      {analyticsData.mostUsedTemplate.title}
                    </p>
                    <p className="text-xs text-green-600">
                      {analyticsData.mostUsedTemplate.usage_count} uses
                    </p>
                  </div>
                )}
                
                {analyticsData.leastUsedTemplate && analyticsData.leastUsedTemplate.usage_count === 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Never Used</span>
                    </div>
                    <p className="text-sm text-orange-700 font-medium">
                      {analyticsData.leastUsedTemplate.title}
                    </p>
                    <p className="text-xs text-orange-600">
                      Consider reviewing or removing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Most frequently used templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.topPerformers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No usage data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analyticsData.topPerformers.map((template, index) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{template.title}</p>
                            <p className="text-xs text-gray-500">{template.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{template.usage_count}</p>
                          <p className="text-xs text-gray-500">uses</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Underperformers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Needs Attention
                </CardTitle>
                <CardDescription>
                  Templates with low usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.underperformers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    All templates are performing well!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analyticsData.underperformers.map((template) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{template.title}</p>
                          <p className="text-xs text-gray-500">{template.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{template.usage_count}</p>
                          <p className="text-xs text-gray-500">uses</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="creation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Recently Created
              </CardTitle>
              <CardDescription>
                Templates created in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.recentlyCreated.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No templates created recently
                </p>
              ) : (
                <div className="space-y-3">
                  {analyticsData.recentlyCreated.map((template) => (
                    <div key={template.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{template.title}</p>
                        <p className="text-xs text-gray-500">{template.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(template.created_at).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {template.usage_count} uses
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}