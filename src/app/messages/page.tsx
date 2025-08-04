"use client";

import { useState, useEffect } from "react";
import { ChatLayout } from "@/components/chat/chat-layout";
import { UpsertSyncDemo } from "@/components/chat/upsert-demo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Settings,
  Database,
  Users,
  User,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useChatStore } from "@/lib/stores/chat";
import { wahaApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function MessagesPage() {
  const { loadConversations, setSidebarCollapsed } = useChatStore();
  const { toast } = useToast();
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  // Bulk sync state
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [bulkSyncResult, setBulkSyncResult] = useState<any>(null);

  // Hide body scroll for fullscreen experience and load conversations
  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Load conversations on mount
    loadConversations();

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [loadConversations]);

  // Bulk sync function
  const handleBulkSync = async () => {
    setIsBulkSyncing(true);
    setBulkSyncResult(null);

    try {
      toast({
        title: "🔄 Starting Bulk Sync",
        description: "Syncing all contacts... This may take a while.",
      });

      const result = await wahaApi.syncAll({
        limit: 100,
        upsert_mode: true,
        sync_options: {
          create_if_new: true,
          update_if_exists: true,
          skip_duplicates: true,
          conflict_resolution: "server_wins",
          include_metadata: true,
          batch_size: 10,
          parallel_sync: false,
        },
        filters: {
          active_sessions_only: true,
          last_activity_hours: 168, // 7 days
        },
      });

      setBulkSyncResult(result);

      toast({
        title: "✅ Bulk Sync Complete!",
        description: `Synced multiple contacts successfully`,
      });
    } catch (error) {
      setBulkSyncResult({
        success: false,
        error: error instanceof Error ? error.message : "Bulk sync failed",
      });

      toast({
        title: "❌ Bulk Sync Failed",
        description: "Check console for details",
        variant: "destructive",
      });
    } finally {
      setIsBulkSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100">
      {/* Top Header */}
      <div className="z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(false)}
            className="lg:hidden"
          >
            ☰
          </Button>
          <h1 className="text-xl font-semibold">Backoffice</h1>
        </div>
        {/* <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Database className="w-4 h-4 mr-2" />
                Contact & Chat Sync
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[500px] sm:w-[600px] max-w-[90vw]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  WhatsApp Contact & Chat Sync
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <Tabs defaultValue="single" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="single"
                      className="flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Single Contact
                    </TabsTrigger>
                    <TabsTrigger
                      value="bulk"
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Bulk Sync
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="single" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <MessageSquare className="w-5 h-5" />
                          Sync Specific Contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <UpsertSyncDemo />
                      </CardContent>
                    </Card>

                    <div className="p-4 rounded-lg bg-blue-50">
                      <h3 className="mb-2 font-semibold text-blue-800">
                        How Upsert Works:
                      </h3>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>
                          • <strong>Create if New:</strong> Records that don't
                          exist are created
                        </li>
                        <li>
                          • <strong>Update if Exists:</strong> Existing records
                          are updated with newer data
                        </li>
                        <li>
                          • <strong>Skip Duplicates:</strong> Exact duplicates
                          are automatically skipped
                        </li>
                        <li>
                          • <strong>Conflict Resolution:</strong> Server data
                          wins in case of conflicts
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="bulk" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Users className="w-5 h-5" />
                          Sync All Contacts
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-gray-600">
                          This will sync messages for all contacts with activity
                          in the last 7 days. Process may take several minutes
                          depending on the number of contacts.
                        </div>

                        <Button
                          onClick={handleBulkSync}
                          disabled={isBulkSyncing}
                          className="w-full"
                          size="lg"
                        >
                          {isBulkSyncing ? (
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

                        {bulkSyncResult && (
                          <div className="p-4 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2 mb-3">
                              {bulkSyncResult.success !== false ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-600" />
                              )}
                              <span className="font-medium">
                                {bulkSyncResult.success !== false
                                  ? "Bulk Sync Completed"
                                  : "Bulk Sync Failed"}
                              </span>
                            </div>

                            {bulkSyncResult.success !== false ? (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Contacts:</span>
                                  <Badge>
                                    {bulkSyncResult.total_contacts || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Processed:</span>
                                  <Badge variant="secondary">
                                    {bulkSyncResult.processed_contacts || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Successful:</span>
                                  <Badge className="text-green-800 bg-green-100">
                                    {bulkSyncResult.successful_syncs || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Failed:</span>
                                  <Badge variant="destructive">
                                    {bulkSyncResult.failed_syncs || 0}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-red-600">
                                {bulkSyncResult.error}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="p-4 rounded-lg bg-amber-50">
                      <h3 className="mb-2 font-semibold text-amber-800">
                        Bulk Sync Features:
                      </h3>
                      <ul className="space-y-1 text-sm text-amber-700">
                        <li>
                          • <strong>Batch Processing:</strong> Processes
                          contacts in batches of 10
                        </li>
                        <li>
                          • <strong>Active Sessions Only:</strong> Only syncs
                          from active WAHA sessions
                        </li>
                        <li>
                          • <strong>Recent Activity:</strong> Focuses on
                          contacts active in last 7 days
                        </li>
                        <li>
                          • <strong>Progress Tracking:</strong> Shows real-time
                          sync progress
                        </li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div> */}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatLayout />
      </div>
    </div>
  );
}
