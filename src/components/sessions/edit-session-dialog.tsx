'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Smartphone, Globe, Save, X, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSessionStore } from '@/lib/stores/session';
import { Session } from '@/types';

const editSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').max(50, 'Name too long'),
  session_name: z.string()
    .min(1, 'Session identifier is required')
    .max(30, 'Identifier too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, and underscores allowed'),
  webhooks: z.array(z.object({
    url: z.string().url('Invalid webhook URL').min(1, 'Webhook URL is required'),
    name: z.string().min(1, 'Webhook name is required').max(50, 'Name too long'),
    enabled: z.boolean(),
  })).optional(),
  is_default: z.boolean(),
  is_active: z.boolean(),
});

type EditSessionData = z.infer<typeof editSessionSchema>;

interface EditSessionDialogProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditSessionDialog({ session, open, onOpenChange, onSuccess }: EditSessionDialogProps) {
  const { updateSession, error, clearError } = useSessionStore();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors }
  } = useForm<EditSessionData>({
    resolver: zodResolver(editSessionSchema),
    defaultValues: {
      name: '',
      session_name: '',
      webhooks: [],
      is_default: false,
      is_active: true,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'webhooks'
  });

  // Reset form when session changes
  useEffect(() => {
    if (session) {
      // Convert single webhook_url to webhooks array format for backward compatibility
      const webhooks = session.webhook_url ? [{
        url: session.webhook_url,
        name: 'Default Webhook',
        enabled: true
      }] : [];

      reset({
        name: session.name || '',
        session_name: session.session_name || '',
        webhooks: webhooks,
        is_default: session.is_default || false,
        is_active: session.is_active ?? true,
      });
    }
  }, [session, reset]);

  const isActiveValue = watch('is_active');

  const isConnected = session?.status === 'working' && session?.phone_number;
  const canEditIdentifier = !isConnected; // Don't allow editing identifier for connected sessions

  const onSubmit = async (data: EditSessionData) => {
    if (!session) return;
    
    clearError();
    setIsSaving(true);
    
    try {
      // Send only the basic session data without duplicating webhook formats
      const updateData = {
        name: data.name,
        session_name: data.session_name,
        is_default: data.is_default,
        is_active: data.is_active,
        webhooks: data.webhooks || []
      };

      await updateSession(session.id, updateData);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to update session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    clearError();
  };

  const addWebhook = () => {
    append({
      url: '',
      name: '',
      enabled: true
    });
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Session Settings
          </DialogTitle>
          <DialogDescription>
            Update settings for "{session.name}". Some options may be limited for connected sessions.
          </DialogDescription>
        </DialogHeader>

        {/* Session Status Info */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Status</span>
            <Badge variant={session.status === 'working' ? 'default' : 'outline'}>
              {session.status?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Smartphone className="h-4 w-4" />
              <span>Connected: {session.phone_number}</span>
            </div>
          )}
          
          {session.last_activity && (
            <div className="text-xs text-gray-500 mt-1">
              Last activity: {new Date(session.last_activity).toLocaleString()}
            </div>
          )}
        </div>

        {/* Warning for connected sessions */}
        {isConnected && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This session is connected to WhatsApp. Some settings cannot be changed while active.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input
                  id="name"
                  placeholder="My WhatsApp Bot"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_name">Session Identifier</Label>
                <Input
                  id="session_name"
                  placeholder="my-whatsapp-bot"
                  disabled={!canEditIdentifier}
                  {...register('session_name')}
                />
                {!canEditIdentifier && (
                  <p className="text-xs text-amber-600">
                    Cannot change identifier for connected sessions
                  </p>
                )}
                {errors.session_name && (
                  <p className="text-sm text-red-600">{errors.session_name.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_default">Default Session</Label>
                  <p className="text-xs text-gray-500">
                    Use this session as the default for new conversations
                  </p>
                </div>
                <Checkbox
                  id="is_default"
                  checked={watch('is_default')}
                  onCheckedChange={(checked: boolean) => setValue('is_default', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_active">Active Session</Label>
                  <p className="text-xs text-gray-500">
                    Enable or disable this session
                  </p>
                </div>
                <Checkbox
                  id="is_active"
                  checked={isActiveValue}
                  onCheckedChange={(checked: boolean) => setValue('is_active', checked)}
                />
              </div>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Webhook URLs</Label>
                  <p className="text-xs text-gray-500">
                    Configure multiple webhook endpoints to receive WhatsApp events
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWebhook}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <Globe className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-4">No webhooks configured</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addWebhook}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Webhook
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Webhook {index + 1}</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={watch(`webhooks.${index}.enabled`)}
                            onCheckedChange={(checked: boolean) => 
                              setValue(`webhooks.${index}.enabled`, checked)
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`webhooks.${index}.name`}>Name</Label>
                        <Input
                          {...register(`webhooks.${index}.name`)}
                          placeholder="Webhook name (e.g., Business Logic, Analytics)"
                        />
                        {errors.webhooks?.[index]?.name && (
                          <p className="text-sm text-red-600">
                            {errors.webhooks[index]?.name?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`webhooks.${index}.url`}>URL</Label>
                        <Input
                          {...register(`webhooks.${index}.url`)}
                          placeholder="https://your-server.com/webhook"
                        />
                        {errors.webhooks?.[index]?.url && (
                          <p className="text-sm text-red-600">
                            {errors.webhooks[index]?.url?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-sm font-medium">Webhook Events</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Checkbox checked disabled />
                    <span>Messages</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Checkbox checked disabled />
                    <span>Status Changes</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Checkbox checked disabled />
                    <span>Group Events</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Checkbox checked disabled />
                    <span>Connection Events</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  All events are automatically sent to all enabled webhooks
                </p>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Session Information</Label>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Session ID:</span>
                    <p className="font-mono text-xs break-all">{session.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <p className="text-xs">{new Date(session.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Updated:</span>
                    <p className="text-xs">{new Date(session.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Messages Sent:</span>
                    <p className="text-xs">{session.messages_sent || 0}</p>
                  </div>
                </div>
              </div>

              {session.profile_name && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">WhatsApp Profile</Label>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {session.profile_picture_url && (
                        <img 
                          src={session.profile_picture_url} 
                          alt="Profile" 
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-green-800">{session.profile_name}</p>
                        <p className="text-sm text-green-600">{session.phone_number}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="min-w-24"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 