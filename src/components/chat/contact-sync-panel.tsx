"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Database, 
  RefreshCw, 
  User, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { wahaApi } from "@/lib/api"

interface SyncResult {
  success: boolean;
  phone_number?: string;
  contact_name?: string;
  new_messages?: number;
  updated_messages?: number;
  skipped_messages?: number;
  total_processed?: number;
  error?: string;
  status?: string;
  last_sync_at?: string;
}

interface SyncAllResult {
  success: boolean;
  total_contacts?: number;
  processed_contacts?: number;
  successful_syncs?: number;
  failed_syncs?: number;
  total_new_messages?: number;
  error?: string;
  contact_results?: SyncResult[];
}

export function ContactSyncPanel() {
  const { toast } = useToast()
  
  // Single contact sync
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  
  // All contacts sync
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [allSyncResult, setAllSyncResult] = useState<SyncAllResult | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)

  const syncContact = async () => {
    if (!phoneNumber) return
    
    setIsLoading(true)
    setSyncResult(null)

    try {
      toast({
        title: "🔄 Starting Contact Sync",
        description: `Syncing messages for ${phoneNumber}...`,
      })

      const result = await wahaApi.syncContact({
        phone_number: phoneNumber,
        limit: 100,
        upsert_mode: true,
        sync_options: {
          create_if_new: true,
          update_if_exists: true,
          skip_duplicates: true,
          conflict_resolution: 'server_wins',
          include_metadata: true
        }
      })

      setSyncResult(result)

      toast({
        title: "✅ Contact Sync Complete!",
        description: `Sync finished for ${phoneNumber}`,
      })

    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : "Sync failed"
      })
      
      toast({
        title: "❌ Contact Sync Failed",
        description: "Check console for details",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Sync all contacts
  const syncAllContacts = async () => {
    setIsLoadingAll(true)
    setAllSyncResult(null)
    setSyncProgress(0)

    try {
      toast({
        title: "🔄 Starting Bulk Sync",
        description: "Syncing all contacts... This may take a while.",
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const result = await wahaApi.syncAll({
        limit: 100,
        upsert_mode: true,
        sync_options: {
          create_if_new: true,
          update_if_exists: true,
          skip_duplicates: true,
          conflict_resolution: 'server_wins',
          include_metadata: true,
          batch_size: 10,
          parallel_sync: false
        },
        filters: {
          active_sessions_only: true,
          last_activity_hours: 168 // 7 days
        }
      }) as SyncAllResult

      clearInterval(progressInterval)
      setSyncProgress(100)
      setAllSyncResult(result)

      toast({
        title: "✅ Bulk Sync Complete!",
        description: `${result?.successful_syncs || 0}/${result?.total_contacts || 0} contacts synced successfully`,
      })

    } catch (error) {
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : "Bulk sync failed"
      }
      setAllSyncResult(errorResult)
      
      toast({
        title: "❌ Bulk Sync Failed",
        description: errorResult.error,
        variant: "destructive"
      })
    } finally {
      setIsLoadingAll(false)
      setSyncProgress(0)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Contact & Chat Sync
        </h2>
        <p className="text-gray-600 mt-1">
          Synchronize WhatsApp contacts and messages with WAHA server
        </p>
      </div>

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Single Contact
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Contacts
          </TabsTrigger>
        </TabsList>

        {/* Single Contact Sync */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Sync Specific Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="628123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={syncContact}
                  disabled={isLoading || !phoneNumber}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Sync Contact
                    </>
                  )}
                </Button>
              </div>

              {syncResult && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {syncResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
                    </span>
                  </div>

                  {syncResult.success ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span className="font-mono text-sm">{phoneNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge>SUCCESS</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      {syncResult.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Sync */}
        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Sync All Contacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                This will sync messages for all contacts with activity in the last 7 days.
                Process may take several minutes depending on the number of contacts.
              </div>

              {isLoadingAll && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Syncing contacts...</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} />
                </div>
              )}

              <Button 
                onClick={syncAllContacts}
                disabled={isLoadingAll}
                className="w-full"
                size="lg"
              >
                {isLoadingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Syncing All Contacts...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Start Bulk Sync
                  </>
                )}
              </Button>

              {allSyncResult && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {allSyncResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {allSyncResult.success ? 'Bulk Sync Completed' : 'Bulk Sync Failed'}
                    </span>
                  </div>

                  {allSyncResult.success ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {allSyncResult.successful_syncs || 0}
                        </div>
                        <div className="text-sm text-gray-600">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {allSyncResult.failed_syncs || 0}
                        </div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {allSyncResult.total_new_messages || 0}
                        </div>
                        <div className="text-sm text-gray-600">New Messages</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      {allSyncResult.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 