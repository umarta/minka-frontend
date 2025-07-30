'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Edit, 
  MoreVertical, 
  UserCheck,
  Calendar,
  Trash2,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { AgentGroup, GroupCardProps } from '@/types/agent-groups';

export function AgentGroupCard({
  group,
  onEdit,
  onDelete,
  onViewMembers,
  isSelected = false,
  onSelect,
  className = '',
}: GroupCardProps) {
  const onlineMembers = group.members?.filter(m => m.isActive).length || 0;
  const offlineMembers = group.memberCount - onlineMembers;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger selection if clicking on buttons or dropdown
    if (e.target instanceof HTMLElement) {
      const isClickableElement = e.target.closest('button') || 
                                e.target.closest('[role="menuitem"]') ||
                                e.target.closest('[data-radix-collection-item]');
      if (!isClickableElement && onSelect) {
        onSelect(group);
      }
    }
  };

  return (
    <Card 
      className={`
        relative transition-all duration-200 hover:shadow-md hover:scale-[1.01] cursor-pointer
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${!group.isActive ? 'opacity-60' : ''}
        ${className}
      `}
      style={{ borderLeft: `4px solid ${group.color}` }}
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900 truncate">
                {group.name}
              </h3>
              {!group.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {group.description || 'No description available'}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewMembers?.(group)}>
                <Eye className="mr-2 h-4 w-4" />
                View Members
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(group)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Group
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete?.(group)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Member Statistics */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
          </div>
          {onlineMembers > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <UserCheck className="h-4 w-4" />
              <span>{onlineMembers} online</span>
            </div>
          )}
        </div>

        {/* Member Status Indicators */}
        {group.memberCount > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: Math.min(group.memberCount, 12) }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < onlineMembers ? 'bg-green-500' : 'bg-gray-300'
                }`}
                title={i < onlineMembers ? 'Online' : 'Offline'}
              />
            ))}
            {group.memberCount > 12 && (
              <span className="text-xs text-gray-500 ml-1">
                +{group.memberCount - 12} more
              </span>
            )}
          </div>
        )}

        {/* Member Avatars */}
        {group.members && group.members.length > 0 && (
          <div className="flex -space-x-2 mb-3">
            {group.members.slice(0, 5).map((member) => (
              <Avatar 
                key={member.id} 
                className="h-7 w-7 border-2 border-white ring-1 ring-gray-200"
              >
                <AvatarFallback className="text-xs bg-gray-100">
                  {member.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {group.members.length > 5 && (
              <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-600 font-medium">
                  +{group.members.length - 5}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Creator Info */}
        {group.creator && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Calendar className="h-3 w-3" />
            <span>
              Created by {group.creator.username} • {
                new Date(group.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              }
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(group);
            }}
            className="flex-1"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewMembers?.(group);
            }}
            className="flex-1"
          >
            <Users className="mr-2 h-4 w-4" />
            Members
          </Button>
        </div>

        {/* Group Color Indicator */}
        <div 
          className="absolute top-2 right-2 w-3 h-3 rounded-full ring-2 ring-white"
          style={{ backgroundColor: group.color }}
          title={`Group color: ${group.color}`}
        />

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute inset-0 bg-blue-50/50 rounded-lg pointer-events-none" />
        )}
      </div>
    </Card>
  );
}

// Skeleton loader for loading states
export function AgentGroupCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        
        {/* Stats skeleton */}
        <div className="flex gap-4 mb-3">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        
        {/* Indicators skeleton */}
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-2 w-2 bg-gray-200 rounded-full"></div>
          ))}
        </div>
        
        {/* Avatars skeleton */}
        <div className="flex -space-x-2 mb-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-7 w-7 bg-gray-200 rounded-full border-2 border-white"></div>
          ))}
        </div>
        
        {/* Meta info skeleton */}
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
        
        {/* Buttons skeleton */}
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    </Card>
  );
}

// Grid layout wrapper for multiple cards
export function AgentGroupCardGrid({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
      ${className}
    `}>
      {children}
    </div>
  );
}