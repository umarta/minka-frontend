'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Users,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Eye
} from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
// import { Slider } from '@/components/ui/slider'; // Not available, will use input range
import { GroupFilters } from '@/types/agent-groups';

interface GroupFilterBarProps {
  filters: GroupFilters;
  onFiltersChange: (filters: GroupFilters) => void;
  onSearch: (query: string) => void;
  className?: string;
  totalGroups?: number;
  filteredCount?: number;
}

export function GroupFilterBar({
  filters,
  onFiltersChange,
  onSearch,
  className = '',
  totalGroups = 0,
  filteredCount = 0,
}: GroupFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localFilters, setLocalFilters] = useState<GroupFilters>(filters);
  const [memberCountRange, setMemberCountRange] = useState([
    filters.memberCount?.min || 1,
    filters.memberCount?.max || 50,
  ]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Apply filters when they change
  useEffect(() => {
    onFiltersChange(localFilters);
  }, [localFilters, onFiltersChange]);

  const handleFilterChange = (key: keyof GroupFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMemberCountChange = (values: number[]) => {
    setMemberCountRange(values);
    handleFilterChange('memberCount', {
      min: values[0],
      max: values[1],
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setLocalFilters({});
    setMemberCountRange([1, 50]);
    onSearch('');
  };

  const hasActiveFilters = () => {
    return searchQuery || 
           localFilters.isActive !== undefined ||
           localFilters.role ||
           localFilters.memberCount?.min !== undefined ||
           localFilters.memberCount?.max !== undefined;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (localFilters.isActive !== undefined) count++;
    if (localFilters.role) count++;
    if (localFilters.memberCount?.min !== undefined || localFilters.memberCount?.max !== undefined) count++;
    return count;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'cs':
        return <UserCheck className="h-3 w-3 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-3 w-3 text-gray-500" />;
      default:
        return <Shield className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search groups by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <Select
          value={localFilters.isActive === undefined ? 'all' : localFilters.isActive ? 'active' : 'inactive'}
          onValueChange={(value) => {
            handleFilterChange('isActive', 
              value === 'all' ? undefined : value === 'active'
            );
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">
              <div className="flex items-center gap-2">
                <UserCheck className="h-3 w-3 text-green-500" />
                Active
              </div>
            </SelectItem>
            <SelectItem value="inactive">
              <div className="flex items-center gap-2">
                <UserX className="h-3 w-3 text-red-500" />
                Inactive
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Role Filter */}
        <Select
          value={localFilters.role || 'all'}
          onValueChange={(value) => {
            handleFilterChange('role', value === 'all' ? undefined : value);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">
              <div className="flex items-center gap-2">
                {getRoleIcon('admin')}
                Admin
              </div>
            </SelectItem>
            <SelectItem value="cs">
              <div className="flex items-center gap-2">
                {getRoleIcon('cs')}
                CS
              </div>
            </SelectItem>
            <SelectItem value="viewer">
              <div className="flex items-center gap-2">
                {getRoleIcon('viewer')}
                Viewer
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
              {getActiveFilterCount() > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-3">Advanced Filters</h4>
              </div>

              {/* Member Count Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Member Count Range
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Min</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={memberCountRange[0]}
                      onChange={(e) => handleMemberCountChange([parseInt(e.target.value) || 1, memberCountRange[1]])}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Max</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={memberCountRange[1]}
                      onChange={(e) => handleMemberCountChange([memberCountRange[0], parseInt(e.target.value) || 50])}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Clear Filters */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {getActiveFilterCount()} filter(s) active
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters()}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {searchQuery && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search: "{searchQuery}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {localFilters.isActive !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {localFilters.isActive ? (
                <UserCheck className="h-3 w-3 text-green-500" />
              ) : (
                <UserX className="h-3 w-3 text-red-500" />
              )}
              {localFilters.isActive ? 'Active' : 'Inactive'}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('isActive', undefined)}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {localFilters.role && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getRoleIcon(localFilters.role)}
              {localFilters.role.toUpperCase()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('role', undefined)}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {(localFilters.memberCount?.min !== undefined || localFilters.memberCount?.max !== undefined) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {memberCountRange[0]}-{memberCountRange[1]} members
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleFilterChange('memberCount', undefined);
                  setMemberCountRange([1, 50]);
                }}
                className="h-4 w-4 p-0 ml-1"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Summary */}
      {totalGroups > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredCount} of {totalGroups} groups
            {hasActiveFilters() && filteredCount !== totalGroups && (
              <span className="text-blue-600 ml-1">(filtered)</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// Compact version for smaller spaces
export function CompactGroupFilterBar({
  onSearch,
  className = '',
}: {
  onSearch: (query: string) => void;
  className?: string;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search groups..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSearchQuery('')}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}