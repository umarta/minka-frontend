'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  RefreshCcw, 
  Download, 
  Upload,
  UserCheck,
  UserX,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { AgentFiltersComponent } from '@/components/agents/agent-filters';
import { AgentList } from '@/components/agents/agent-list';
import { AgentFormModal } from '@/components/agents/agent-form-modal';
import { useAgentStore } from '@/lib/stores/agent';
import { AgentFilters, Agent, CreateAgentData, UpdateAgentData } from '@/types/agent';
import { toast } from 'sonner';

export default function AgentsPage() {
  const {
    agents,
    isLoading,
    error,
    totalAgents,
    currentPage,
    totalPages,
    filters,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    updateAgentStatus,
    bulkUpdateStatus,
    bulkDeleteAgents,
    setFilters,
    clearError,
  } = useAgentStore();

  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch agents on component mount and when filters change
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Handle filter changes
  const handleFiltersChange = (newFilters: AgentFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setFilters({ ...filters, search: query, page: 1 });
  };

  // Agent selection handlers
  const handleAgentSelect = (agentId: number, selected: boolean) => {
    if (selected) {
      setSelectedAgentIds(prev => [...prev, agentId]);
    } else {
      setSelectedAgentIds(prev => prev.filter(id => id !== agentId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedAgentIds(agents.map(agent => agent.id));
    } else {
      setSelectedAgentIds([]);
    }
  };

  // CRUD operations
  const handleCreateAgent = async (data: CreateAgentData) => {
    setIsSubmitting(true);
    try {
      await createAgent(data);
      toast.success('Agent created successfully');
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error('Failed to create agent: ' + (error as Error).message);
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditAgent(agent);
  };

  const handleUpdateAgent = async (data: UpdateAgentData) => {
    if (!editAgent) return;
    
    setIsSubmitting(true);
    try {
      await updateAgent(editAgent.id, data);
      toast.success('Agent updated successfully');
      setEditAgent(null);
    } catch (error) {
      toast.error('Failed to update agent: ' + (error as Error).message);
      throw error; // Re-throw to prevent modal from closing
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    try {
      await deleteAgent(agent.id);
      toast.success(`Agent ${agent.fullName} deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete agent: ' + (error as Error).message);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    try {
      await updateAgentStatus(agent.id, !agent.isActive);
      toast.success(`Agent ${agent.fullName} ${!agent.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update agent status: ' + (error as Error).message);
    }
  };

  const handleViewAgent = (agent: Agent) => {
    // TODO: Implement agent details view
    toast.info('Agent details view coming soon!');
  };

  // Bulk operations
  const handleBulkActivate = async () => {
    if (selectedAgentIds.length === 0) return;
    
    try {
      const result = await bulkUpdateStatus(selectedAgentIds, true);
      toast.success(`${result.updated} agents activated successfully`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} agents failed to activate`);
      }
      setSelectedAgentIds([]);
    } catch (error) {
      toast.error('Failed to activate agents: ' + (error as Error).message);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedAgentIds.length === 0) return;
    
    try {
      const result = await bulkUpdateStatus(selectedAgentIds, false);
      toast.success(`${result.updated} agents deactivated successfully`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} agents failed to deactivate`);
      }
      setSelectedAgentIds([]);
    } catch (error) {
      toast.error('Failed to deactivate agents: ' + (error as Error).message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAgentIds.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedAgentIds.length} selected agents? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      const result = await bulkDeleteAgents(selectedAgentIds);
      toast.success(`${result.deleted} agents deleted successfully`);
      if (result.failed > 0) {
        toast.warning(`${result.failed} agents failed to delete`);
      }
      setSelectedAgentIds([]);
    } catch (error) {
      toast.error('Failed to delete agents: ' + (error as Error).message);
    }
  };

  const handleRefresh = () => {
    loadAgents();
    toast.success('Agents list refreshed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
          <p className="text-muted-foreground">
            Manage customer service agents and their permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {agents.filter(a => a.isActive).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter(a => a.onlineStatus === 'online').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Badge variant="outline">Time</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length > 0 
                ? Math.round(agents.reduce((sum, a) => sum + a.avgResponseTime, 0) / agents.length)
                : 0}m
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Badge variant="outline">★</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.length > 0 
                ? (agents.reduce((sum, a) => sum + a.customerSatisfaction, 0) / agents.length).toFixed(1)
                : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedAgentIds.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedAgentIds.length} selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Bulk Actions:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkActivate}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDeactivate}>
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <AgentFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        totalAgents={totalAgents}
        isLoading={isLoading}
      />

      {/* Agent List */}
      <AgentList
        agents={agents}
        selectedAgentIds={selectedAgentIds}
        isLoading={isLoading}
        onAgentSelect={handleAgentSelect}
        onSelectAll={handleSelectAll}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
        onToggleStatus={handleToggleStatus}
        onViewAgent={handleViewAgent}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
              disabled={currentPage <= 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
              disabled={currentPage >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Agent Modal */}
      <AgentFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAgent as (data: CreateAgentData | UpdateAgentData) => Promise<void>}
        isLoading={isSubmitting}
      />

      {/* Edit Agent Modal */}
      <AgentFormModal
        isOpen={!!editAgent}
        onClose={() => setEditAgent(null)}
        onSubmit={handleUpdateAgent as (data: CreateAgentData | UpdateAgentData) => Promise<void>}
        agent={editAgent}
        isLoading={isSubmitting}
      />
    </div>
  );
}