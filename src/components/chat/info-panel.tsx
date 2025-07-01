'use client';

import { useState } from 'react';
import { X, User, MessageSquare, Tag, StickyNote, Calendar, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatStore } from '@/lib/stores/chat';
import { formatDistanceToNow } from 'date-fns';

export function InfoPanel() {
  const { activeContact, activeConversation, toggleRightSidebar } = useChatStore();

  if (!activeContact) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900">Contact Info</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleRightSidebar}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Contact Profile */}
        <Card>
          <CardHeader className="text-center">
            <Avatar className="h-20 w-20 mx-auto mb-3">
              <AvatarImage src={activeContact.avatar_url} />
              <AvatarFallback className="bg-gray-200 text-gray-700 text-lg">
                {getInitials(activeContact.name)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{activeContact.name}</CardTitle>
            <p className="text-sm text-gray-500">{activeContact.phone}</p>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{activeContact.phone}</span>
                </div>
                {activeContact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{activeContact.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    Joined {formatDistanceToNow(new Date(activeContact.created_at), { addSuffix: true })}
                  </span>
                </div>
                {activeContact.last_seen && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Last seen {formatDistanceToNow(new Date(activeContact.last_seen), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Labels */}
            {activeContact.labels && activeContact.labels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="h-4 w-4" />
                    Labels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {activeContact.labels.map((label) => (
                      <Badge
                        key={label.id}
                        variant="secondary"
                        style={{ backgroundColor: label.color + '20', color: label.color }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conversation Status */}
            {activeConversation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageSquare className="h-4 w-4" />
                    Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant="outline">
                      {activeConversation.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unread</span>
                    <Badge variant="secondary">
                      {activeConversation.unread_count}
                    </Badge>
                  </div>
                  {activeConversation.assigned_to && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Assigned to</span>
                      <Badge variant="outline">
                        {activeConversation.assigned_to.username}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chat History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total messages</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span>First contact</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(activeContact.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last activity</span>
                    <span className="font-medium">
                      {activeConversation ? formatDistanceToNow(new Date(activeConversation.last_activity), { addSuffix: true }) : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket History */}
            {activeConversation?.ticket && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">{activeConversation.ticket.title}</h4>
                    <p className="text-sm text-gray-600">{activeConversation.ticket.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {activeConversation.ticket.status}
                      </Badge>
                      <Badge variant="secondary">
                        {activeConversation.ticket.priority}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <StickyNote className="h-4 w-4" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeContact.notes ? (
                  <p className="text-sm text-gray-700">{activeContact.notes}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No notes available</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Label
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 