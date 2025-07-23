'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useLabelStore } from '@/lib/stores/labels';
import { toast } from 'sonner';

interface LabelToolbarProps {
  onCreateLabel: () => void;
  showSelection: boolean;
  onToggleSelection: () => void;
}

export function LabelToolbar({ 
  onCreateLabel, 
  showSelection, 
  onToggleSelection 
}: LabelToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  
  const {
    filters,
    setFilters,
    clearFilters,
    selectedLabels,
    clearSelection,
    bulkDeleteLabels,
    searchLabels,
    isDeleting,
    labels,
  } = useLabelStore();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchLabels(query);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === 'all' || value === '') {
      delete newFilters[key as keyof typeof filters];
    } else {
      (newFilters as any)[key] = value;
    }
    setFilters(newFilters);
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteLabels(selectedLabels);
      toast.success(`${selectedLabels.length} labels deleted successfully`);
      setShowBulkDeleteDialog(false);
      clearSelection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete labels');
    }
  };

  const hasActiveFilters = Object.keys(filters).some(
    key => filters[key as keyof typeof filters] && filters[key as keyof typeof filters] !== 'all'
  );

  return (
    <>
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        {/* Left side - Search and Filters */}
        <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search labels..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-full lg:w-64"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              {filters.type && filters.type !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Type: {filters.type}
                  <button
                    onClick={() => handleFilterChange('type', 'all')}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Selection Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSelection}
            className="flex items-center gap-2"
          >
            {showSelection ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {showSelection ? 'Cancel' : 'Select'}
          </Button>

          {/* Bulk Actions */}
          {showSelection && selectedLabels.length > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {selectedLabels.length} selected
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowBulkDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Create Button */}
          <Button onClick={onCreateLabel} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Label
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          {searchQuery ? (
            <span>Search results for &quot;{searchQuery}&quot;</span>
          ) : (
            <span>
              Showing {labels.length} label{labels.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {showSelection && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={selectedLabels.length === 0}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Labels</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedLabels.length} selected label
              {selectedLabels.length !== 1 ? 's' : ''}? This action cannot be undone.
              The labels will be removed from all contacts and conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Labels'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}