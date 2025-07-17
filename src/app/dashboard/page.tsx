'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Ticket, TrendingUp, Clock, Activity, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useDashboardStore, useDashboardStats, useRecentActivities, useSystemStatus, useDashboardLoading } from '@/lib/stores/dashboard';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  // Initialize global notification sound
  useNotificationSound();

  const { fetchDashboardStats, fetchRecentActivity, fetchSystemStatus } = useDashboardStore();
  const stats = useDashboardStats();
  const recentActivities = useRecentActivities();
  const systemStatus = useSystemStatus();
  const isLoading = useDashboardLoading();

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
    fetchSystemStatus();
  }, [fetchDashboardStats, fetchRecentActivity, fetchSystemStatus]);

  const statsData = [
    {
      title: 'Active Sessions',
      value: stats?.active_sessions?.toString() || '0',
      description: `${stats?.active_sessions || 0} active sessions`,
      icon: MessageSquare,
      trend: 'up',
      color: 'text-green-600'
    },
    {
      title: 'Total Contacts',
      value: stats?.total_contacts?.toLocaleString() || '0',
      description: `${stats?.new_contacts_today || 0} new today`,
      icon: Users,
      trend: 'up',
      color: 'text-blue-600'
    },
    {
      title: 'Open Tickets',
      value: stats?.open_tickets?.toString() || '0',
      description: `${stats?.resolved_tickets_today || 0} resolved today`,
      icon: Ticket,
      trend: 'down',
      color: 'text-orange-600'
    },
    {
      title: 'Response Rate',
      value: `${stats?.response_rate || 0}%`,
      description: 'Average response time',
      icon: TrendingUp,
      trend: 'up',
      color: 'text-purple-600'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return MessageSquare;
      case 'ticket':
        return Ticket;
      case 'session':
        return Activity;
      case 'system':
        return AlertCircle;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-green-100 text-green-600';
      case 'ticket':
        return 'bg-blue-100 text-blue-600';
      case 'session':
        return 'bg-purple-100 text-purple-600';
      case 'system':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Overview of your WhatsApp Customer Service system
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className={`text-xs flex items-center ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest events and updates in your system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-start space-x-4 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.slice(0, 4).map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                          <ActivityIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>
                Current health and status of system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemStatus.map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        service.status === 'operational' 
                          ? 'bg-green-500' 
                          : service.status === 'maintenance'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">
                        {service.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        service.status === 'operational'
                          ? 'bg-green-100 text-green-800'
                          : service.status === 'maintenance'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {service.uptime} uptime
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts for managing your WhatsApp CS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'View Active Sessions',
                  description: 'Monitor all active WhatsApp sessions',
                  icon: Smartphone,
                  href: '/sessions',
                  color: 'bg-green-50 text-green-600 hover:bg-green-100'
                },
                {
                  title: 'Manage Tickets',
                  description: 'Handle customer support tickets',
                  icon: Ticket,
                  href: '/tickets',
                  color: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                },
                {
                  title: 'View Analytics',
                  description: 'Check performance metrics and reports',
                  icon: TrendingUp,
                  href: '/analytics',
                  color: 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }
              ].map((action) => (
                <div
                  key={action.title}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${action.color}`}
                >
                  <div className="flex items-center space-x-3">
                    <action.icon className="h-6 w-6" />
                    <div>
                      <h3 className="font-medium">{action.title}</h3>
                      <p className="text-sm opacity-75">{action.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 