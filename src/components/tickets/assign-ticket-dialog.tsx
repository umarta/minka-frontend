import { useState, useEffect } from 'react';
import { User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTicketStore } from '@/lib/stores/ticket';
import { Ticket, User as UserType } from '@/types';

interface AssignTicketDialogProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock agents data - in a real app, this would come from an API
const mockAgents: UserType[] = [
  {
    id: '1',
    username: 'john.doe',
    email: 'john.doe@company.com',
    full_name: 'John Doe',
    role: 'agent',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    username: 'jane.smith',
    email: 'jane.smith@company.com',
    full_name: 'Jane Smith',
    role: 'agent',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-15T09:15:00Z',
  },
  {
    id: '3',
    username: 'mike.johnson',
    email: 'mike.johnson@company.com',
    full_name: 'Mike Johnson',
    role: 'agent',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-15T08:45:00Z',
  },
];

export function AssignTicketDialog({ ticket, isOpen, onClose }: AssignTicketDialogProps) {
  const { assignTicket, isLoading } = useTicketStore();
  const [selectedAgent, setSelectedAgent] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAgent(ticket?.assigned_to || null);
      setSearchQuery('');
    }
  }, [isOpen, ticket]);

  const filteredAgents = mockAgents.filter(agent =>
    agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!ticket || !selectedAgent) return;

    try {
      await assignTicket(ticket.id, selectedAgent.id);
      onClose();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isOnline = (lastLogin?: string) => {
    if (!lastLogin) return false;
    const lastLoginTime = new Date(lastLogin).getTime();
    const now = new Date().getTime();
    const timeDiff = now - lastLoginTime;
    return timeDiff < 30 * 60 * 1000; // Consider online if last seen within 30 minutes
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Ticket
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Ticket: <span className="font-medium">{ticket.title}</span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Agents</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Current Assignment */}
          {ticket.assigned_to && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Currently Assigned To:</div>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={ticket.assigned_to.profile_image} />
                  <AvatarFallback className="bg-blue-500 text-white text-xs">
                    {getInitials(ticket.assigned_to.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{ticket.assigned_to.full_name}</div>
                  <div className="text-xs text-gray-500">{ticket.assigned_to.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Agent List */}
          <div className="space-y-2">
            <Label>Available Agents</Label>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={agent.profile_image} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {getInitials(agent.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline(agent.last_login) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm truncate">{agent.full_name}</div>
                        {isOnline(agent.last_login) && (
                          <Badge variant="default" className="bg-green-500 text-xs">
                            Online
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{agent.email}</div>
                      <div className="text-xs text-gray-400">
                        Role: {agent.role} • Last seen: {agent.last_login ? new Date(agent.last_login).toLocaleString() : 'Never'}
                      </div>
                    </div>

                    {selectedAgent?.id === agent.id && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredAgents.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No agents found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedAgent || isLoading}
          >
            {isLoading ? 'Assigning...' : 'Assign Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 