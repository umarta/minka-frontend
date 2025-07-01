"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, RefreshCw, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SimpleSyncPanel() {
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const handleUpsertSync = async () => {
    if (!phoneNumber) return
    
    setIsLoading(true)
    setLastResult(null)

    try {
      toast({
        title: "🔄 Starting Upsert Sync",
        description: "Creating if new, updating if exists...",
      })

      // Simulate API call with upsert logic
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful result demonstrating upsert behavior
      const mockResult = {
        success: true,
        new_records: Math.floor(Math.random() * 5),
        updated_records: Math.floor(Math.random() * 3),
        skipped_records: Math.floor(Math.random() * 2),
        total_processed: 0
      }
      mockResult.total_processed = mockResult.new_records + mockResult.updated_records + mockResult.skipped_records

      setLastResult(mockResult)

      toast({
        title: "✅ Upsert Sync Complete!",
        description: `${mockResult.new_records} created, ${mockResult.updated_records} updated, ${mockResult.skipped_records} skipped`,
      })

      setPhoneNumber("")

    } catch (error) {
      setLastResult({
        success: false,
        error: "Sync failed"
      })
      
      toast({
        title: "❌ Sync Failed",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Upsert Functionality:</strong> This sync creates new records if they don't exist, 
          and updates existing records with newer data from WAHA. No duplicates are created.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            WhatsApp Upsert Sync Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="628123456789"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          
          <Button 
            onClick={handleUpsertSync}
            disabled={isLoading || !phoneNumber}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing with Upsert...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Start Upsert Sync
              </>
            )}
          </Button>

          {lastResult && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                {lastResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                Sync Result
              </h4>
              {lastResult.success ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between">
                    <span className="text-sm">🆕 Created:</span>
                    <Badge variant="outline" className="text-green-600">
                      {lastResult.new_records}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">🔄 Updated:</span>
                    <Badge variant="outline" className="text-blue-600">
                      {lastResult.updated_records}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">⏭️ Skipped:</span>
                    <Badge variant="outline" className="text-gray-600">
                      {lastResult.skipped_records}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">📊 Total:</span>
                    <Badge className="bg-blue-600">
                      {lastResult.total_processed}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-red-600">
                  ❌ {lastResult.error}
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-1 p-3 bg-blue-50 rounded-lg">
            <p><strong>Upsert Logic Explained:</strong></p>
            <p>• ✅ <strong>Create if New:</strong> Records that don't exist are created</p>
            <p>• 🔄 <strong>Update if Exists:</strong> Existing records are updated with newer WAHA data</p>
            <p>• ⏭️ <strong>Skip Duplicates:</strong> Exact duplicates are automatically skipped</p>
            <p>• 🏆 <strong>Conflict Resolution:</strong> Server data wins in case of conflicts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 