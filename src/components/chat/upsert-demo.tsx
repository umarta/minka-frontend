"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { wahaApi } from "@/lib/api"
import type { SyncContactRequest, SyncResult } from "@/types"

export function UpsertSyncDemo() {
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    new_records?: number;
    updated_records?: number;
    skipped_records?: number;
    total_processed?: number;
    error?: string;
  } | null>(null)

  const performUpsertSync = async () => {
    if (!phoneNumber) return
    
    setIsLoading(true)
    setSyncResult(null)

    try {
      toast({
        title: "🔄 Upsert Sync Started",
        description: "Creating if new, updating if exists...",
      })

      // Upsert sync request with explicit options
      const syncRequest: SyncContactRequest = {
        phone_number: phoneNumber,
        limit: 100,
        upsert_mode: true, // 🔑 This enables upsert behavior
        sync_options: {
          create_if_new: true,      // ✅ Create new records
          update_if_exists: true,   // ✅ Update existing records
          skip_duplicates: true,    // ✅ Skip exact duplicates
          conflict_resolution: 'server_wins', // Server data wins
          include_metadata: true
        }
      }

      const result = await wahaApi.syncContact(syncRequest) as SyncResult
      
      setSyncResult({
        success: true,
        new_records: result?.new_records || 0,
        updated_records: result?.updated_records || 0,
        skipped_records: result?.skipped_records || 0,
        total_processed: result?.total_processed || 0
      })

      toast({
        title: "✅ Upsert Sync Complete!",
        description: `${result?.new_records || 0} created, ${result?.updated_records || 0} updated`,
      })

    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : "Sync failed"
      })
      
      toast({
        title: "❌ Sync Failed",
        description: "Check console for details",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Upsert Sync Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="628123456789"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        
        <Button 
          onClick={performUpsertSync}
          disabled={isLoading || !phoneNumber}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            "Start Upsert Sync"
          )}
        </Button>

        {syncResult && (
          <div className="p-3 bg-gray-50 rounded">
            {syncResult.success ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <Badge>{syncResult.new_records}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Updated:</span>
                  <Badge>{syncResult.updated_records}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Skipped:</span>
                  <Badge>{syncResult.skipped_records}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-red-600">
                Error: {syncResult.error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 