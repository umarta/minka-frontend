'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tags, Plus, Filter, Hash, TrendingUp, Star } from 'lucide-react';
import { useLabelStore } from '@/lib/stores/labels';

export function LabelStats() {
  const { stats, fetchStats, labels } = useLabelStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Calculate stats from current labels if API stats are not available
  const calculatedStats = {
    total_labels: labels.length,
    system_labels: labels.filter(label => 
      label.name.toLowerCase().includes('urgent') || 
      label.name.toLowerCase().includes('high') ||
      label.name.toLowerCase().includes('medium') ||
      label.name.toLowerCase().includes('low') ||
      label.name.toLowerCase().includes('important')
    ).length,
    custom_labels: labels.filter(label => 
      !label.name.toLowerCase().includes('urgent') && 
      !label.name.toLowerCase().includes('high') &&
      !label.name.toLowerCase().includes('medium') &&
      !label.name.toLowerCase().includes('low') &&
      !label.name.toLowerCase().includes('important')
    ).length,
    active_labels: labels.length, // Assuming all labels are active for now
    new_this_week: labels.filter(label => {
      const createdDate = new Date(label.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length,
    tagged_items: 0, // This would need to come from backend
  };

  const displayStats = stats || calculatedStats;

  const statsCards = [
    {
      title: 'Total Labels',
      value: displayStats.total_labels,
      description: 'Labels created',
      icon: Tags,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'New This Week',
      value: displayStats.new_this_week,
      description: 'Labels added this week',
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Active Labels',
      value: displayStats.active_labels,
      description: 'Labels in use',
      icon: Filter,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Tagged Items',
      value: displayStats.tagged_items,
      description: 'Items with labels',
      icon: Hash,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Label Types Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Label Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm">System Labels</span>
                </div>
                <Badge variant="secondary">{displayStats.system_labels}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Custom Labels</span>
                </div>
                <Badge variant="secondary">{displayStats.custom_labels}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Labels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Popular Labels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {labels.length > 0 ? (
              <div className="space-y-2">
                {labels.slice(0, 5).map((label) => (
                  <div key={label.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm truncate">{label.name}</span>
                    </div>
                    <Badge variant="outline">{label.usage}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No labels created yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}