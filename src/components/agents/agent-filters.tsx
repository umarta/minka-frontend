'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  Filter,
  X,
  Users,
  Shield,
  Eye,
  Building,
  Circle,
  CheckCircle,
  Clock,
  UserX
} from 'lucide-react';
import { AgentFilters, AgentRole, OnlineStatus, AgentStatus } from '@/types/agent';
import { cn } from '@/lib/utils';

interface AgentFiltersProps {
  filters: AgentFilters;
  onFiltersChange: (filters: AgentFilters) => void;
  onSearch: (query: string) => void;
  totalAgents: number;
  isLoading?: boolean;
}

const ROLE_OPTIONS: { value: AgentRole; label: string; icon: React.ReactNode }[] = [
  { value: 'admin', label: 'Administrator', icon: <Shield className="h-4 w-4" /> },
  { value: 'cs', label: 'Customer Service', icon: <Users className="h-4 w-4" /> },
  { value: 'viewer', label: 'Viewer', icon: <Eye className="h-4 w-4" /> },
];

const STATUS_OPTIONS: { value: AgentStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'active', label: 'Active', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  { value: 'inactive', label: 'Inactive', icon: <UserX className="h-4 w-4 text-red-500" /> },
];

const ONLINE_STATUS_OPTIONS: { value: OnlineStatus; label: string; color: string }[] = [
  { value: 'online', label: 'Online', color: 'bg-green-500' },
  { value: 'away', label: 'Away', color: 'bg-yellow-500' },
  { value: 'busy', label: 'Busy', color: 'bg-red-500' },
  { value: 'offline', label: 'Offline', color: 'bg-gray-400' },
];

const DEPARTMENT_OPTIONS = [
  'Customer Service',
  'Technical Support',
  'Sales',
  'Billing',
  'General',
  'Management'
];

const PERFORMANCE_OPTIONS = [
  { value: 'high', label: 'High Performance', description: 'Top performers' },
  { value: 'medium', label: 'Medium Performance', description: 'Average performers' },
  { value: 'low', label: 'Low Performance', description: 'Needs improvement' },
];

export function AgentFiltersComponent({
  filters,
  onFiltersChange,
  onSearch,
  totalAgents,
  isLoading = false
}: AgentFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onSearch(localSearch);
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [localSearch, onSearch]);

  const handleFilterChange = (key: keyof AgentFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset to first page when filters change
    if (key !== 'page') {
      newFilters.page = 1;
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    onFiltersChange({
      page: 1,
      limit: filters.limit || 20,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.role) count++;
    if (filters.status) count++;
    if (filters.onlineStatus) count++;
    if (filters.department) count++;
    if (filters.performanceLevel) count++;
    if (filters.search) count++;
    if (filters.hasGroups !== undefined) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents by name, username, or email..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Role Filter */}
            <Select
              value={filters.role || ''}
              onValueChange={(value) => handleFilterChange('role', value || undefined)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex items-center gap-2">
                      {role.icon}
                      {role.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value || undefined)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      {status.icon}
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Online Status Filter */}
            <Select
              value={filters.onlineStatus || ''}
              onValueChange={(value) => handleFilterChange('onlineStatus', value || undefined)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Online Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Online Status</SelectItem>
                {ONLINE_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <Circle className={cn("h-3 w-3 rounded-full", status.color)} />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* More Filters Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                  {activeFilterCount > 3 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                      {activeFilterCount - 3}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="font-medium text-sm">Additional Filters</div>

                  {/* Department Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Department
                    </label>
                    <Select
                      value={filters.department || ''}
                      onValueChange={(value) => handleFilterChange('department', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Departments</SelectItem>
                        {DEPARTMENT_OPTIONS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Performance Level Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Performance Level</label>
                    <Select
                      value={filters.performanceLevel || ''}
                      onValueChange={(value) => handleFilterChange('performanceLevel', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Performance Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Performance Levels</SelectItem>
                        {PERFORMANCE_OPTIONS.map((perf) => (
                          <SelectItem key={perf.value} value={perf.value}>
                            <div className="flex flex-col items-start">
                              <span>{perf.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {perf.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Group Membership Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Group Membership</label>
                    <Select
                      value={filters.hasGroups === undefined ? '' : filters.hasGroups.toString()}
                      onValueChange={(value) => 
                        handleFilterChange('hasGroups', value === '' ? undefined : value === 'true')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Agents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Agents</SelectItem>
                        <SelectItem value="true">Has Groups</SelectItem>
                        <SelectItem value="false">No Groups</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
        </div>

        {/* Active Filter Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {filters.role && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Role: {filters.role}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('role', undefined)}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {filters.status}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('status', undefined)}
                />
              </Badge>
            )}
            {filters.onlineStatus && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Online: {filters.onlineStatus}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('onlineStatus', undefined)}
                />
              </Badge>
            )}
            {filters.department && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Dept: {filters.department}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('department', undefined)}
                />
              </Badge>
            )}
            {filters.performanceLevel && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Performance: {filters.performanceLevel}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('performanceLevel', undefined)}
                />
              </Badge>
            )}
            {filters.hasGroups !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Groups: {filters.hasGroups ? 'Has Groups' : 'No Groups'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('hasGroups', undefined)}
                />
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{filters.search}"
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => {
                    setLocalSearch('');
                    handleFilterChange('search', undefined);
                  }}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-sm text-muted-foreground">
          <div>
            Showing {totalAgents} agent{totalAgents !== 1 ? 's' : ''}
            {activeFilterCount > 0 && ' (filtered)'}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Updated just now
          </div>
        </div>
      </CardContent>
    </Card>
  );
}