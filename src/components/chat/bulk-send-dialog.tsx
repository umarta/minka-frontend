'use client';

import { useState, useEffect } from 'react';
import { Send, Users, AlertTriangle, CheckCircle, X, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Contact, BulkMessageRequest, BulkMessageResponse, BulkMessageResult } from '@/types';
import { useAntiBlockingStore } from '@/lib/stores/antiBlocking';
import { useToast } from '@/hooks/use-toast';

interface BulkSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onSuccess?: () => void;
}

export function BulkSendDialog({ open, onOpenChange, contacts, onSuccess }: BulkSendDialogProps) {
  const { toast } = useToast();
  const { bulkSend, bulkResult, loading, error } = useAntiBlockingStore();
  
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState('');
  const [sessionName, setSessionName] = useState('default');
  const [delayBetweenMessages, setDelayBetweenMessages] = useState('60');
  const [maxConcurrent, setMaxConcurrent] = useState('2');
  const [stopOnError, setStopOnError] = useState(false);
  const [validateOnly, setValidateOnly] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedContacts(contacts.slice(0, 10)); // Default to first 10 contacts
      setMessage('');
      setShowResults(false);
    }
  }, [open, contacts]);

  const handleContactToggle = (contact: Contact) => {
    setSelectedContacts(prev => 
      prev.find(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    );
  };

  const handleSelectAll = () => {
    setSelectedContacts(contacts);
  };

  const handleSelectNone = () => {
    setSelectedContacts([]);
  };

  const handleSend = async () => {
    if (!message.trim() || selectedContacts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a message and select at least one contact.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: BulkMessageRequest = {
        contact_ids: selectedContacts.map(c => parseInt(c.id)),
        session_name: sessionName,
        content: message,
        message_type: 'text',
        admin_id: 1, // TODO: Get from auth store
        options: {
          delay_between_messages: `${delayBetweenMessages}s`,
          max_concurrent: parseInt(maxConcurrent),
          stop_on_error: stopOnError,
          validate_only: validateOnly,
          priority: 'NORMAL',
        },
      };

      await bulkSend(payload);
      setShowResults(true);
      
      if (!validateOnly && bulkResult?.successful && bulkResult.successful > 0) {
        toast({
          title: "Bulk Send Complete",
          description: `Successfully sent ${bulkResult.successful} messages.`,
        });
        onSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Bulk Send Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const getResultIcon = (result: BulkMessageResult) => {
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <X className="h-4 w-4 text-red-500" />;
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Bulk Send Messages
          </DialogTitle>
          <DialogDescription>
            Send messages to multiple contacts with anti-blocking protection
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* Contact Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Select Contacts ({selectedContacts.length}/{contacts.length})</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectNone}>
                    Select None
                  </Button>
                </div>
              </div>
              
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`contact-${contact.id}`}
                      checked={selectedContacts.some(c => c.id === contact.id)}
                      onCheckedChange={() => handleContactToggle(contact)}
                    />
                    <Label htmlFor={`contact-${contact.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>{contact.name || 'Unknown'}</span>
                        <span className="text-muted-foreground text-sm">
                          {contact.phone || contact.phone_number}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Content */}
            <div className="space-y-3">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows={4}
              />
              <div className="text-sm text-muted-foreground">
                {message.length} characters
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="session">Session</Label>
                <Select value={sessionName} onValueChange={setSessionName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Session</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="delay">Delay Between Messages (seconds)</Label>
                <Input
                  id="delay"
                  type="number"
                  value={delayBetweenMessages}
                  onChange={(e) => setDelayBetweenMessages(e.target.value)}
                  min="30"
                  max="300"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="concurrent">Max Concurrent</Label>
                <Input
                  id="concurrent"
                  type="number"
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(e.target.value)}
                  min="1"
                  max="5"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="priority">Priority</Label>
                <Select defaultValue="NORMAL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label>Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stop-on-error"
                    checked={stopOnError}
                    onCheckedChange={(checked) => setStopOnError(checked as boolean)}
                  />
                  <Label htmlFor="stop-on-error">Stop on first error</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="validate-only"
                    checked={validateOnly}
                    onCheckedChange={(checked) => setValidateOnly(checked as boolean)}
                  />
                  <Label htmlFor="validate-only">Validate only (don't send)</Label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Results View */
          <div className="space-y-4">
            {bulkResult && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{bulkResult.successful}</div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{bulkResult.failed}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{bulkResult.validated}</div>
                    <div className="text-sm text-blue-600">Validated</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{bulkResult.rejected}</div>
                    <div className="text-sm text-orange-600">Rejected</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Risk Level:</span>
                    <Badge className={getRiskColor(bulkResult.risk_level)}>
                      {bulkResult.risk_level}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Time:</span>
                    <span>{bulkResult.total_time}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Average Delay:</span>
                    <span>{bulkResult.average_delay}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Detailed Results</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {bulkResult.results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getResultIcon(result)}
                          <span className="text-sm">
                            Contact {result.contact_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.risk_level && (
                            <Badge className={getRiskColor(result.risk_level)}>
                              {result.risk_level}
                            </Badge>
                          )}
                          {result.success ? (
                            <span className="text-sm text-green-600">Success</span>
                          ) : (
                            <span className="text-sm text-red-600">{result.error}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          {!showResults ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={loading || selectedContacts.length === 0}>
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : validateOnly ? (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Validate
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedContacts.length} contacts
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 