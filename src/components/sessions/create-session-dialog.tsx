'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Smartphone, Globe, X, Save, AlertTriangle, Trash2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSessionStore } from '@/lib/stores/session';

const createSessionSchema = z.object({
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
});

type CreateSessionData = z.infer<typeof createSessionSchema>;

interface CreateSessionDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateSessionDialog({ trigger, onSuccess }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const { createSession, isCreating, error, clearError } = useSessionStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors }
  } = useForm<CreateSessionData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      name: '',
      session_name: '',
      webhooks: [],
      is_default: false,
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'webhooks'
  });

  const sessionName = watch('session_name');
  const name = watch('name');

  // Auto-generate session_name from name
  const handleNameChange = (value: string) => {
    setValue('name', value);
    if (!sessionName) {
      const identifier = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('session_name', identifier);
    }
  };

  const onSubmit = async (data: CreateSessionData) => {
    clearError();
    
    try {
      // Send only the basic session data without duplicating webhook formats
      const sessionData = {
        name: data.name,
        session_name: data.session_name,
        is_default: data.is_default,
        webhooks: data.webhooks || []
      };

      const result = await createSession(sessionData);
      
      if (result) {
        setOpen(false);
        reset();
        onSuccess?.();
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleClose = () => {
    setOpen(false);
    reset();
    clearError();
  };

  const addWebhook = () => {
    append({
      url: '',
      name: '',
      enabled: true
    });
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Session
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Create New WhatsApp Session
          </DialogTitle>
          <DialogDescription>
            Configure a new WhatsApp session. You'll be able to scan the QR code after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Setup</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Session Name</Label>
                <Input
                  id="name"
                  placeholder="My WhatsApp Bot"
                  {...register('name')}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  A friendly name to identify this session
                </p>
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="session_name">Session Identifier</Label>
                <Input
                  id="session_name"
                  placeholder="my-whatsapp-bot"
                  {...register('session_name')}
                />
                <p className="text-xs text-gray-500">
                  Technical identifier (auto-generated from name). Use only letters, numbers, hyphens, and underscores.
                </p>
                {errors.session_name && (
                  <p className="text-sm text-red-600">{errors.session_name.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is_default">Set as Default Session</Label>
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
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Webhook URLs</Label>
                  <p className="text-xs text-gray-500">
                    Configure webhook endpoints to receive WhatsApp events (optional)
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
                  <p className="text-xs text-gray-400 mb-4">
                    You can add webhooks now or configure them later from session settings
                  </p>
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

              {fields.length > 0 && (
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
              disabled={isCreating}
              className="min-w-24"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Session
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 