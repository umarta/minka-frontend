'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Clock, AlertTriangle, CheckCircle, Users, MoreHorizontal, Edit, Trash, UserPlus } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTicketStore } from '@/lib/stores/ticket';
import { Ticket, TicketStatus, TicketPriority } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { TicketForm } from '@/components/tickets/ticket-form';
import { TicketFilters } from '@/components/tickets/ticket-filters';
import { AssignTicketDialog } from '@/components/tickets/assign-ticket-dialog';
import { useNotificationSound } from '@/hooks/use-notification-sound';

export default function TicketsPage() {
  // Initialize global notification sound
  useNotificationSound();

  const {
    tickets,
    isLoading,
    error,
    filters,
    totalCount,
    fetchTickets,
    updateTicket,
    deleteTicket,
    assignTicket,
    setFilters,
    clearError
  } = useTicketStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | undefined>(undefined);
  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query });
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-orange-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSLAStatus = (ticket: Ticket) => {
    if (ticket.sla_breached) {
      return { text: 'Breached', color: 'text-red-600' };
    }
    
    if (ticket.due_date) {
      const dueDate = new Date(ticket.due_date);
      const now = new Date();
      const hoursLeft = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursLeft < 2) {
        return { text: 'Critical', color: 'text-red-600' };
      } else if (hoursLeft < 24) {
        return { text: 'Warning', color: 'text-orange-600' };
      }
    }
    
    return { text: 'OK', color: 'text-green-600' };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
            <p className="text-gray-600">Manage customer support tickets and service requests</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Open</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {tickets.filter(t => t.status === 'open').length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {tickets.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">SLA Breached</p>
                  <p className="text-2xl font-bold text-red-600">
                    {tickets.filter(t => t.sla_breached).length}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tickets.filter(t => t.status === 'resolved').length}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets by title, description, or contact..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <TicketFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-red-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Tickets Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Tickets ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading tickets...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => {
                    const slaStatus = getSLAStatus(ticket);
                    
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-xs">{ticket.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {ticket.description}
                            </p>
                            {ticket.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {ticket.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {ticket.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{ticket.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.contact && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={ticket.contact.avatar_url} />
                                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                  {getInitials(ticket.contact.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{ticket.contact.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={getPriorityColor(ticket.priority)}
                          >
                            {ticket.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`} />
                            <span className="text-sm capitalize">
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.assigned_to ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={ticket.assigned_to.profile_image} />
                                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                  {getInitials(ticket.assigned_to.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{ticket.assigned_to.username}</span>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAssigningTicket(ticket)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${slaStatus.color}`}>
                            {slaStatus.text}
                          </span>
                          {ticket.due_date && (
                            <p className="text-xs text-gray-500">
                              Due {formatDistanceToNow(new Date(ticket.due_date), { addSuffix: true })}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingTicket(ticket)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setAssigningTicket(ticket)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateTicket(ticket.id, { status: 'resolved' })}
                                disabled={ticket.status === 'resolved'}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark Resolved
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this ticket?')) {
                                    deleteTicket(ticket.id);
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {tickets.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating your first ticket.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Ticket
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Ticket Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <TicketForm
              onSuccess={() => {
                setShowCreateDialog(false);
                fetchTickets();
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Ticket Dialog */}
        <Dialog open={!!editingTicket} onOpenChange={(open) => !open && setEditingTicket(undefined)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Ticket</DialogTitle>
            </DialogHeader>
            <TicketForm
              ticket={editingTicket}
              onSuccess={() => {
                setEditingTicket(undefined);
                fetchTickets();
              }}
              onCancel={() => setEditingTicket(undefined)}
            />
          </DialogContent>
        </Dialog>

        {/* Assign Ticket Dialog */}
        <AssignTicketDialog
          ticket={assigningTicket}
          open={!!assigningTicket}
          onOpenChange={(open) => !open && setAssigningTicket(null)}
          onSuccess={() => {
            setAssigningTicket(null);
            fetchTickets();
          }}
        />
      </div>
    </MainLayout>
  );
} 