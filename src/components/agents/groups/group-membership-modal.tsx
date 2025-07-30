'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  Search, 
  UserPlus, 
  UserMinus, 
  Check, 
  X,
  AlertCircle,
  Loader2,
  Filter,
  UserCheck,
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
  AgentGroup,
  AdminSummary,
  MembershipModalProps,
} from '@/types/agent-groups';

interface MemberWithStatus extends AdminSummary {
  isCurrentMember: boolean;
  isPendingAdd: boolean;
  isPendingRemove: boolean;
}

export function GroupMembershipModal({
  isOpen,
  onClose,
  group,
  availableAgents,
  onUpdateMembers,
}: MembershipModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pendingChanges, setPendingChanges] = useState<{
    toAdd: number[];
    toRemove: number[];
  }>({ toAdd: [], toRemove: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setRoleFilter('all');
      setStatusFilter('all');
      setPendingChanges({ toAdd: [], toRemove: [] });
      setError('');
    }
  }, [isOpen, group]);

  // Create members list with status
  const membersWithStatus = useMemo((): MemberWithStatus[] => {
    const currentMemberIds = new Set(group.members?.map(m => m.id) || []);
    
    return availableAgents.map(agent => ({
      ...agent,
      isCurrentMember: currentMemberIds.has(agent.id),
      isPendingAdd: pendingChanges.toAdd.includes(agent.id),
      isPendingRemove: pendingChanges.toRemove.includes(agent.id),
    }));
  }, [availableAgents, group.members, pendingChanges]);

  // Filter members based on search and filters
  const filteredMembers = useMemo(() => {
    return membersWithStatus.filter(member => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!member.username.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'all' && member.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        switch (statusFilter) {
          case 'active':
            return member.isActive;
          case 'inactive':
            return !member.isActive;
          case 'members':
            return member.isCurrentMember && !member.isPendingRemove;
          case 'non-members':
            return !member.isCurrentMember && !member.isPendingAdd;
          default:
            return true;
        }
      }

      return true;
    });
  }, [membersWithStatus, searchQuery, roleFilter, statusFilter]);

  // Get role-specific icon
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

  // Handle member selection
  const handleMemberToggle = (memberId: number, isCurrentMember: boolean) => {
    setPendingChanges(prev => {
      if (isCurrentMember) {
        // Currently a member - toggle removal
        if (prev.toRemove.includes(memberId)) {
          return {
            ...prev,
            toRemove: prev.toRemove.filter(id => id !== memberId),
          };
        } else {
          return {
            ...prev,
            toRemove: [...prev.toRemove, memberId],
            toAdd: prev.toAdd.filter(id => id !== memberId), // Remove from add if present
          };
        }
      } else {
        // Not a member - toggle addition
        if (prev.toAdd.includes(memberId)) {
          return {
            ...prev,
            toAdd: prev.toAdd.filter(id => id !== memberId),
          };
        } else {
          return {
            ...prev,
            toAdd: [...prev.toAdd, memberId],
            toRemove: prev.toRemove.filter(id => id !== memberId), // Remove from remove if present
          };
        }
      }
    });
    setError(''); // Clear any existing errors
  };

  // Handle bulk selection
  const handleSelectAll = (select: boolean) => {
    if (select) {
      const allVisibleIds = filteredMembers.map(m => m.id);
      const nonMembers = allVisibleIds.filter(id => 
        !membersWithStatus.find(m => m.id === id)?.isCurrentMember
      );
      setPendingChanges(prev => ({
        toAdd: [...new Set([...prev.toAdd, ...nonMembers])],
        toRemove: prev.toRemove,
      }));
    } else {
      setPendingChanges({ toAdd: [], toRemove: [] });
    }
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const currentCount = group.memberCount;
    const finalCount = currentCount + pendingChanges.toAdd.length - pendingChanges.toRemove.length;
    const hasChanges = pendingChanges.toAdd.length > 0 || pendingChanges.toRemove.length > 0;
    
    return {
      currentCount,
      finalCount,
      toAdd: pendingChanges.toAdd.length,
      toRemove: pendingChanges.toRemove.length,
      hasChanges,
    };
  }, [group.memberCount, pendingChanges]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!summary.hasChanges) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Apply changes to members list
      const currentMemberIds = new Set(group.members?.map(m => m.id) || []);
      
      // Add new members
      pendingChanges.toAdd.forEach(id => currentMemberIds.add(id));
      // Remove members
      pendingChanges.toRemove.forEach(id => currentMemberIds.delete(id));
      
      await onUpdateMembers(group.id, Array.from(currentMemberIds));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group members');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get member status and styling
  const getMemberStatus = (member: MemberWithStatus) => {
    if (member.isPendingAdd) {
      return { status: 'Adding', className: 'bg-green-100 text-green-800 border-green-200' };
    }
    if (member.isPendingRemove) {
      return { status: 'Removing', className: 'bg-red-100 text-red-800 border-red-200' };
    }
    if (member.isCurrentMember) {
      return { status: 'Member', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    return { status: 'Available', className: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Group Members
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: group.color }}
            />
            <span className="font-medium">{group.name}</span>
            <span>•</span>
            <span>{summary.currentCount} current members</span>
          </div>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters and Search */}
        <div className="flex flex-col gap-3 p-1">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="cs">CS</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="members">Members</SelectItem>
                <SelectItem value="non-members">Non-members</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSelectAll(true)}
                disabled={filteredMembers.length === 0}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add All Visible
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleSelectAll(false)}
                disabled={!summary.hasChanges}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Changes
              </Button>
            </div>
            <span className="text-sm text-gray-500">
              {filteredMembers.length} of {availableAgents.length} agents
            </span>
          </div>
        </div>

        <Separator />

        {/* Members List */}
        <ScrollArea className="flex-1 p-1">
          <div className="space-y-2">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No agents found matching your criteria</p>
              </div>
            ) : (
              filteredMembers.map((member) => {
                const memberStatus = getMemberStatus(member);
                const isSelected = member.isPendingAdd || (member.isCurrentMember && !member.isPendingRemove);
                
                return (
                  <div 
                    key={member.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border transition-all
                      hover:bg-gray-50 cursor-pointer
                      ${isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}
                    `}
                    onClick={() => handleMemberToggle(member.id, member.isCurrentMember)}
                  >
                    <Checkbox 
                      checked={isSelected}
                      onChange={() => {}} // Handled by div click
                      className="pointer-events-none"
                    />
                    
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-100">
                        {member.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {member.username}
                        </span>
                        {getRoleIcon(member.role)}
                        {!member.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 capitalize">
                        {member.role}
                      </span>
                    </div>
                    
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${memberStatus.className}`}
                    >
                      {memberStatus.status}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Summary */}
        {summary.hasChanges && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Pending Changes</h4>
            <div className="flex gap-4 text-sm">
              {summary.toAdd > 0 && (
                <span className="text-green-700">
                  +{summary.toAdd} to add
                </span>
              )}
              {summary.toRemove > 0 && (
                <span className="text-red-700">
                  -{summary.toRemove} to remove
                </span>
              )}
              <span className="text-blue-700">
                Final count: {summary.finalCount} members
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !summary.hasChanges}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {summary.hasChanges ? 'Apply Changes' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Member count display component
export function MemberCountDisplay({ 
  current, 
  total, 
  className = '' 
}: { 
  current: number; 
  total: number; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Users className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-600">
        {current} of {total} members
      </span>
    </div>
  );
}