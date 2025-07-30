'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  User,
  Mail,
  Phone,
  Building,
  MoreHorizontal,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Shield,
  Eye,
  Clock,
  Users,
  Loader2
} from 'lucide-react';
import { Agent, AgentRole } from '@/types/agent';
import { cn } from '@/lib/utils';

interface AgentListProps {
  agents: Agent[];
  selectedAgentIds: number[];
  isLoading?: boolean;
  onAgentSelect: (agentId: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agent: Agent) => void;
  onToggleStatus: (agent: Agent) => void;
  onViewAgent: (agent: Agent) => void;
}

const getRoleIcon = (role: AgentRole) => {
  switch (role) {
    case 'admin':
      return <Shield className="h-4 w-4" />;
    case 'cs':
      return <User className="h-4 w-4" />;
    case 'viewer':
      return <Eye className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const getRoleColor = (role: AgentRole) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cs':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'viewer':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getOnlineStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-yellow-500';
    case 'busy':
      return 'bg-red-500';
    case 'offline':
    default:
      return 'bg-gray-400';
  }
};

const formatLastSeen = (lastSeen: string) => {
  const date = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return date.toLocaleDateString();
};

export function AgentList({
  agents,
  selectedAgentIds,
  isLoading = false,
  onAgentSelect,
  onSelectAll,
  onEditAgent,
  onDeleteAgent,
  onToggleStatus,
  onViewAgent
}: AgentListProps) {
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);

  const isAllSelected = agents.length > 0 && selectedAgentIds.length === agents.length;
  const isPartiallySelected = selectedAgentIds.length > 0 && selectedAgentIds.length < agents.length;

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
  };

  const handleAgentSelect = (agent: Agent, checked: boolean) => {
    onAgentSelect(agent.id, checked);
  };

  const handleDeleteClick = (agent: Agent) => {
    setDeleteAgent(agent);
  };

  const handleDeleteConfirm = () => {
    if (deleteAgent) {
      onDeleteAgent(deleteAgent);
      setDeleteAgent(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No agents found</h3>
            <p className="text-sm text-muted-foreground">
              Create your first agent to get started with customer support management.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Agents ({agents.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                ref={(ref) => {
                  if (ref) {
                    const element = ref as unknown as HTMLInputElement;
                    element.indeterminate = isPartiallySelected;
                  }
                }}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedAgentIds.length > 0 && (
                  `${selectedAgentIds.length} selected`
                )}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  "p-4 hover:bg-muted/50 transition-colors",
                  selectedAgentIds.includes(agent.id) && "bg-muted/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedAgentIds.includes(agent.id)}
                      onCheckedChange={(checked) => handleAgentSelect(agent, checked as boolean)}
                    />
                    
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={agent.avatar} alt={agent.fullName} />
                        <AvatarFallback>
                          {agent.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                          getOnlineStatusColor(agent.onlineStatus)
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm truncate">{agent.fullName}</h3>
                        <Badge
                          variant="outline"
                          className={cn("text-xs flex items-center gap-1", getRoleColor(agent.role))}
                        >
                          {getRoleIcon(agent.role)}
                          {agent.role}
                        </Badge>
                        {!agent.isActive && (
                          <Badge variant="destructive" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          @{agent.username}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {agent.email}
                        </div>
                        {agent.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {agent.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {agent.department}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last seen: {formatLastSeen(agent.lastSeen)}
                        </div>
                        <div className="capitalize">
                          Status: {agent.onlineStatus}
                        </div>
                        {agent.currentTickets > 0 && (
                          <div>
                            {agent.currentTickets} active tickets
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Performance indicators */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-4">
                      <div className="text-center">
                        <div className="font-medium text-foreground">{agent.ticketsResolvedToday}</div>
                        <div>Tickets</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">{agent.avgResponseTime}m</div>
                        <div>Avg Response</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-foreground">{agent.customerSatisfaction.toFixed(1)}</div>
                        <div>Rating</div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => onViewAgent(agent)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => onEditAgent(agent)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Agent
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => onToggleStatus(agent)}>
                          {agent.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(agent)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Agent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAgent} onOpenChange={() => setDeleteAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteAgent?.fullName}</strong>? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}