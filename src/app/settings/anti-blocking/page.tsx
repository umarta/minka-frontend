'use client';

import { useState, useEffect } from 'react';
import { Shield, Settings, BarChart3, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AntiBlockingConfig, AntiBlockingStats } from '@/types';
import { useAntiBlockingStore } from '@/lib/stores/antiBlocking';
import { useToast } from '@/hooks/use-toast';

export default function AntiBlockingSettingsPage() {
  const { toast } = useToast();
  const { 
    config, 
    stats, 
    loading, 
    error, 
    fetchConfig, 
    updateConfig, 
    fetchStats 
  } = useAntiBlockingStore();

  const [localConfig, setLocalConfig] = useState<Partial<AntiBlockingConfig>>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, [fetchConfig, fetchStats]);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateConfig(localConfig);
      setIsEditing(false);
      toast({
        title: "Configuration Updated",
        description: "Anti-blocking settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update configuration",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    if (config) {
      setLocalConfig(config);
    }
    setIsEditing(false);
  };

  const updateField = (field: keyof AntiBlockingConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
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

  // Helper function to safely extract numeric value from delay fields
  const getDelayValue = (delayField: string | number | undefined, defaultValue: number): number => {
    if (typeof delayField === 'string') {
      return parseInt(delayField.replace('s', '')) || defaultValue;
    }
    return delayField || defaultValue;
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Anti-Blocking Settings
          </h1>
          <p className="text-muted-foreground">
            Configure WhatsApp anti-blocking protection and monitor system status
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Configuration
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
                <CardDescription>
                  Core anti-blocking configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-anti-blocking">Enable Anti-Blocking</Label>
                  <Switch
                    id="enable-anti-blocking"
                    checked={localConfig.enable_anti_blocking || false}
                    onCheckedChange={(checked) => updateField('enable_anti_blocking', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-hourly">Max Messages/Hour</Label>
                    <Input
                      id="max-hourly"
                      type="number"
                      value={localConfig.max_messages_per_hour || 4}
                      onChange={(e) => updateField('max_messages_per_hour', parseInt(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-daily">Max Messages/Day</Label>
                    <Input
                      id="max-daily"
                      type="number"
                      value={localConfig.max_messages_per_day || 20}
                      onChange={(e) => updateField('max_messages_per_day', parseInt(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-bulk">Max Bulk/Hour</Label>
                    <Input
                      id="max-bulk"
                      type="number"
                      value={localConfig.max_bulk_messages_per_hour || 10}
                      onChange={(e) => updateField('max_bulk_messages_per_hour', parseInt(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-length">Max Message Length</Label>
                    <Input
                      id="max-length"
                      type="number"
                      value={localConfig.max_message_length || 1000}
                      onChange={(e) => updateField('max_message_length', parseInt(e.target.value))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timing Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Timing Controls</CardTitle>
                <CardDescription>
                  Delay and timing configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-delay">Min Delay (seconds)</Label>
                    <Input
                      id="min-delay"
                      type="number"
                      value={getDelayValue(localConfig.min_delay_between_messages, 30)}
                      onChange={(e) => updateField('min_delay_between_messages', `${e.target.value}s`)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-delay">Max Delay (seconds)</Label>
                    <Input
                      id="max-delay"
                      type="number"
                      value={getDelayValue(localConfig.max_delay_between_messages, 60)}
                      onChange={(e) => updateField('max_delay_between_messages', `${e.target.value}s`)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="typing-min">Typing Min (seconds)</Label>
                    <Input
                      id="typing-min"
                      type="number"
                      value={getDelayValue(localConfig.typing_duration_min, 2)}
                      onChange={(e) => updateField('typing_duration_min', `${e.target.value}s`)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="typing-max">Typing Max (seconds)</Label>
                    <Input
                      id="typing-max"
                      type="number"
                      value={getDelayValue(localConfig.typing_duration_max, 8)}
                      onChange={(e) => updateField('typing_duration_max', `${e.target.value}s`)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-typing">Enable Typing Indicators</Label>
                    <Switch
                      id="enable-typing"
                      checked={localConfig.enable_typing_indicators || false}
                      onCheckedChange={(checked) => updateField('enable_typing_indicators', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-seen">Enable Seen Confirmations</Label>
                    <Switch
                      id="enable-seen"
                      checked={localConfig.enable_seen_confirmation || false}
                      onCheckedChange={(checked) => updateField('enable_seen_confirmation', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-delays">Enable Random Delays</Label>
                    <Switch
                      id="enable-delays"
                      checked={localConfig.enable_random_delays || false}
                      onCheckedChange={(checked) => updateField('enable_random_delays', checked)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Content Validation</CardTitle>
                <CardDescription>
                  Message content restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-variation">Enable Message Variation</Label>
                  <Switch
                    id="enable-variation"
                    checked={localConfig.enable_message_variation || false}
                    onCheckedChange={(checked) => updateField('enable_message_variation', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require-https">Require HTTPS Links</Label>
                  <Switch
                    id="require-https"
                    checked={localConfig.require_https_links || false}
                    onCheckedChange={(checked) => updateField('require_https_links', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forbidden-words">Forbidden Words (one per line)</Label>
                  <Textarea
                    id="forbidden-words"
                    value={localConfig.forbidden_words?.join('\n') || ''}
                    onChange={(e) => updateField('forbidden_words', e.target.value.split('\n').filter(word => word.trim()))}
                    placeholder="spam&#10;marketing&#10;promo"
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forbidden-domains">Forbidden Domains (one per line)</Label>
                  <Textarea
                    id="forbidden-domains"
                    value={localConfig.forbidden_domains?.join('\n') || ''}
                    onChange={(e) => updateField('forbidden_domains', e.target.value.split('\n').filter(domain => domain.trim()))}
                    placeholder="bit.ly&#10;tinyurl.com&#10;goo.gl"
                    rows={4}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>
                  Advanced anti-blocking features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-monitoring">Enable Blocking Monitoring</Label>
                  <Switch
                    id="enable-monitoring"
                    checked={localConfig.enable_blocking_monitoring || false}
                    onCheckedChange={(checked) => updateField('enable_blocking_monitoring', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enable-logging">Enable Rate Limit Logging</Label>
                  <Switch
                    id="enable-logging"
                    checked={localConfig.enable_rate_limit_logging || false}
                    onCheckedChange={(checked) => updateField('enable_rate_limit_logging', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="alert-threshold">Blocking Alert Threshold</Label>
                  <Input
                    id="alert-threshold"
                    type="number"
                    value={localConfig.blocking_alert_threshold || 80}
                    onChange={(e) => updateField('blocking_alert_threshold', parseInt(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="session-cooldown">Session Cooldown (seconds)</Label>
                  <Input
                    id="session-cooldown"
                    type="number"
                    value={getDelayValue(localConfig.session_cooldown_period, 300)}
                    onChange={(e) => updateField('session_cooldown_period', `${e.target.value}s`)}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Contacts Tracked</span>
                    <Badge variant="secondary">{stats.total_contacts_tracked}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Sessions Tracked</span>
                    <Badge variant="secondary">{stats.total_sessions_tracked}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(stats.contact_stats).length} active contacts
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bulk Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {Object.keys(stats.bulk_stats).length} active sessions
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  No statistics available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Monitoring</CardTitle>
              <CardDescription>
                Monitor anti-blocking system health and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                Risk monitoring dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 