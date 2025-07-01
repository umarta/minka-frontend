import { TopContactData } from '@/lib/stores/analytics';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, DollarSign } from 'lucide-react';

interface TopContactsTableProps {
  data: TopContactData[];
  isLoading: boolean;
}

export function TopContactsTable({ data, isLoading }: TopContactsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4 p-3">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No contact data available
      </div>
    );
  }

  const getSpentBadgeVariant = (amount: number) => {
    if (amount >= 1000) return 'default';
    if (amount >= 500) return 'secondary';
    return 'outline';
  };

  const getContactInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Contact</div>
        <div className="col-span-2 text-center">Messages</div>
        <div className="col-span-2 text-center">Spent</div>
        <div className="col-span-3">Last Message</div>
      </div>

      {/* Contact Rows */}
      <div className="space-y-1">
        {data.map((contact, index) => (
          <div 
            key={contact.contactId} 
            className="grid grid-cols-12 gap-3 items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {/* Rank */}
            <div className="col-span-1">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                {index + 1}
              </div>
            </div>

            {/* Contact Info */}
            <div className="col-span-4 flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white text-xs">
                  {getContactInitials(contact.contactName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {contact.contactName}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{contact.phone}</span>
                </div>
              </div>
            </div>

            {/* Message Count */}
            <div className="col-span-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900">{contact.messageCount}</span>
              </div>
            </div>

            {/* Total Spent */}
            <div className="col-span-2 text-center">
              <Badge variant={getSpentBadgeVariant(contact.totalSpent)} className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span>${contact.totalSpent.toFixed(0)}</span>
              </Badge>
            </div>

            {/* Last Message */}
            <div className="col-span-3">
              <div className="text-sm text-gray-600 truncate" title={contact.lastMessage}>
                {contact.lastMessage}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, contact) => sum + contact.messageCount, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Messages</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            ${data.reduce((sum, contact) => sum + contact.totalSpent, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Revenue</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            ${data.length > 0 ? (data.reduce((sum, contact) => sum + contact.totalSpent, 0) / data.length).toFixed(0) : '0'}
          </div>
          <div className="text-xs text-gray-500">Avg per Contact</div>
        </div>
      </div>
    </div>
  );
} 