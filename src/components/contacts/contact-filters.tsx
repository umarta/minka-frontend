'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Send } from 'lucide-react';
import { useContactStore } from '@/lib/stores/contact';
import { BulkSendDialog } from '../chat/bulk-send-dialog';
import { useState } from 'react';

interface ContactFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  contacts: any[];
}

export function ContactFilters({ filters, onFiltersChange, contacts }: ContactFiltersProps) {
  const { labels } = useContactStore();
  const [showBulkSend, setShowBulkSend] = useState(false);

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : status,
    });
  };

  const handleLabelToggle = (labelId: string) => {
    const currentLabels = filters.labels || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter((id: string) => id !== labelId)
      : [...currentLabels, labelId];
    
    onFiltersChange({
      ...filters,
      labels: newLabels.length ? newLabels : undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({ status: 'all' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Filters</CardTitle>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contacts</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Label Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Labels</label>
          <div className="space-y-2">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => handleLabelToggle(label.id)}
              >
                <Badge
                  variant="outline"
                  style={{ borderColor: label.color, color: label.color }}
                >
                  {label.name}
                </Badge>
                {filters.labels?.includes(label.id) && (
                  <X className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {(filters.status !== 'all' || filters.labels?.length) && (
          <div>
            <label className="text-sm font-medium mb-2 block">Active Filters</label>
            <div className="flex flex-wrap gap-2">
              {filters.status && filters.status !== 'all' && (
                <Badge variant="secondary">
                  Status: {filters.status}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => handleStatusChange('all')}
                  />
                </Badge>
              )}
              {filters.labels?.map((labelId: string) => {
                const label = labels.find(l => l.id === labelId);
                return label ? (
                  <Badge
                    key={labelId}
                    variant="secondary"
                    style={{ backgroundColor: label.color + '20', color: label.color }}
                  >
                    {label.name}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => handleLabelToggle(labelId)}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkSend(true)}
              disabled={contacts.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Bulk Send
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Bulk Send Dialog */}
      <BulkSendDialog
        open={showBulkSend}
        onOpenChange={setShowBulkSend}
        contacts={contacts}
        onSuccess={() => {
          // TODO: Refresh contacts or show success message
          console.log('Bulk send completed');
        }}
      />
    </Card>
  );
} 