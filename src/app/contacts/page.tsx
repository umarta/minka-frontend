'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, Users, MessageSquare, Tag, MoreHorizontal, Edit, Trash, Archive } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useContactStore } from '@/lib/stores/contact';
import { Contact } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ContactForm } from '@/components/contacts/contact-form';
import { ImportContactsDialog } from '@/components/contacts/import-contacts-dialog';
import { ContactFilters } from '@/components/contacts/contact-filters';

export default function ContactsPage() {
  const {
    contacts,
    isLoading,
    error,
    filters,
    selectedContacts,
    totalCount,
    fetchContacts,
    deleteContact,
    updateContact,
    bulkUpdateContacts,
    selectContact,
    selectAllContacts,
    clearSelection,
    setFilters,
    clearError
  } = useContactStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search: query });
  };

  const handleBulkAction = async (action: string) => {
    if (selectedContacts.length === 0) return;

    try {
      switch (action) {
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) {
            await Promise.all(selectedContacts.map(id => deleteContact(id)));
            clearSelection();
          }
          break;
        case 'archive':
          await bulkUpdateContacts(selectedContacts, { is_blocked: true });
          clearSelection();
          break;
        case 'export':
          // TODO: Implement export functionality
          break;
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
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

  const renderTableView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>All Contacts ({totalCount})</CardTitle>
          {selectedContacts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedContacts.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
                Archive
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                Export
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkAction('delete')}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAllContacts();
                    } else {
                      clearSelection();
                    }
                  }}
                />
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Labels</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={() => selectContact(contact.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.avatar_url} />
                      <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      {contact.email && (
                        <p className="text-sm text-gray-500">{contact.email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{contact.phone}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.labels?.slice(0, 2).map((label) => (
                      <Badge 
                        key={label.id} 
                        variant="secondary" 
                        className="text-xs"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                    {contact.labels && contact.labels.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{contact.labels.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {contact.last_seen ? formatDistanceToNow(new Date(contact.last_seen), { addSuffix: true }) : 'Never'}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={contact.is_blocked ? 'destructive' : 'default'}>
                    {contact.is_blocked ? 'Blocked' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateContact(contact.id, { is_blocked: !contact.is_blocked })}>
                        <Archive className="h-4 w-4 mr-2" />
                        {contact.is_blocked ? 'Unblock' : 'Block'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this contact?')) {
                            deleteContact(contact.id);
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
            ))}
          </TableBody>
        </Table>

        {contacts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by adding your first contact.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {contacts.map((contact) => (
        <Card key={contact.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Checkbox
                checked={selectedContacts.includes(contact.id)}
                onCheckedChange={() => selectContact(contact.id)}
              />
              <Avatar className="h-12 w-12">
                <AvatarImage src={contact.avatar_url} />
                <AvatarFallback className="bg-gray-200 text-gray-700">
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{contact.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{contact.phone}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {contact.labels && contact.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {contact.labels.slice(0, 3).map((label) => (
                  <Badge 
                    key={label.id} 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: label.color + '20', color: label.color }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                {contact.last_seen ? formatDistanceToNow(new Date(contact.last_seen), { addSuffix: true }) : 'Never active'}
              </span>
              <Badge variant={contact.is_blocked ? 'destructive' : 'default'} className="text-xs">
                {contact.is_blocked ? 'Blocked' : 'Active'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600">Manage your customer contacts and communications</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" onClick={() => handleBulkAction('export')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold">{totalCount}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {contacts.filter(c => !c.is_blocked).length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Blocked</p>
                  <p className="text-2xl font-bold text-red-600">
                    {contacts.filter(c => c.is_blocked).length}
                  </p>
                </div>
                <div className="w-3 h-3 bg-red-400 rounded-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">With Labels</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {contacts.filter(c => c.labels && c.labels.length > 0).length}
                  </p>
                </div>
                <Tag className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search contacts by name, phone, or email..."
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
            
            <Select value={viewMode} onValueChange={(value: 'table' | 'grid') => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="table">Table</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <ContactFilters
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

        {/* Contacts List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading contacts...</p>
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          renderTableView()
        ) : (
          renderGridView()
        )}

        {/* Create Contact Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <ContactForm
              onSuccess={() => {
                setShowCreateDialog(false);
                fetchContacts();
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Contact Dialog */}
        <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Contact</DialogTitle>
            </DialogHeader>
            <ContactForm
              contact={editingContact}
              onSuccess={() => {
                setEditingContact(null);
                fetchContacts();
              }}
              onCancel={() => setEditingContact(null)}
            />
          </DialogContent>
        </Dialog>

        {/* Import Contacts Dialog */}
        <ImportContactsDialog
          isOpen={showImportDialog}
          onClose={() => {
            setShowImportDialog(false);
            fetchContacts();
          }}
        />
      </div>
    </MainLayout>
  );
} 