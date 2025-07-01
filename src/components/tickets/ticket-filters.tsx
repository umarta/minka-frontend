import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TicketStatus, TicketPriority } from '@/types';

interface TicketFiltersProps {
  onFiltersChange: (filters: any) => void;
  filters?: any;
}

export function TicketFilters({ onFiltersChange, filters = {} }: TicketFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.keys(localFilters).length}
              </Badge>
            )}
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Active Filters:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(localFilters).map(([key, value]) => (
                <Badge key={key} variant="outline" className="flex items-center gap-1">
                  <span className="capitalize">{key}: {value as string}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => clearFilter(key)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <Select onValueChange={(value) => updateFilter('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SLA Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">SLA Status</label>
            <Select onValueChange={(value) => updateFilter('sla_status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All SLA statuses..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breached">Breached</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Quick Presets:</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newFilters = { status: 'open', priority: 'urgent' };
                setLocalFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              Urgent Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newFilters = { sla_status: 'breached' };
                setLocalFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              SLA Breached
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newFilters = { status: 'in_progress' };
                setLocalFilters(newFilters);
                onFiltersChange(newFilters);
              }}
            >
              In Progress
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 