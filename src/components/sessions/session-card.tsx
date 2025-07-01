'use client';

import { useState } from 'react';
import { Play, Square, RotateCcw, Trash2, Settings, QrCode, Smartphone, MoreVertical, LogOut, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Session, SessionStatus } from '@/types';
import { useSessionStore } from '@/lib/stores/session';

interface SessionCardProps {
  session: Session;
  onShowQR?: (session: Session) => void;
  onEdit?: (session: Session) => void;
}

export function SessionCard({ session, onShowQR, onEdit }: SessionCardProps) {
  const { 
    startSession, 
    stopSession, 
    restartSession, 
    logoutSession,
    deleteSession,
    syncSessions,
    error,
    clearError 
  } = useSessionStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scan_qr_code':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'starting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'stopped':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDot = (status: SessionStatus) => {
    switch (status) {
      case 'working':
        return 'bg-green-400';
      case 'scan_qr_code':
        return 'bg-yellow-400';
      case 'starting':
        return 'bg-blue-400 animate-pulse';
      case 'failed':
        return 'bg-red-400';
      case 'stopped':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const handleAction = async (action: () => Promise<void>) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    clearError();
    
    try {
      await action();
    } catch (err) {
      console.error('Session action failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStart = () => handleAction(() => startSession(session.session_name));
  const handleStop = () => handleAction(() => stopSession(session.session_name));
  const handleRestart = () => handleAction(() => restartSession(session.session_name));
  const handleLogout = () => handleAction(() => logoutSession(session.session_name));
  
  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    clearError();
    
    try {
      await syncSessions();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteSession(session.id);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const canStart = session.status === 'stopped' || session.status === 'failed' || session.status === 'STOPPED' || session.status === 'FAILED';
  const canStop = session.status === 'working' || session.status === 'scan_qr_code' || session.status === 'starting' || session.status === 'WORKING' || session.status === 'SCAN_QR_CODE' || session.status === 'STARTING';
  const canLogout = (session.status === 'working' || session.status === 'WORKING') && session.phone_number;
  const canShowQR = session.status === 'scan_qr_code' || session.status === 'SCAN_QR_CODE';
  const canSync = session.status === 'working' || session.status === 'WORKING'; // Allow sync for active sessions (both cases)



  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Smartphone className="h-8 w-8 text-gray-600" />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusDot(session.status)}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{session.name}</CardTitle>
              <CardDescription>
                {session.session_name}
                {session.is_default && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </CardDescription>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(session)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Settings
                </DropdownMenuItem>
              )}
              {canShowQR && onShowQR && (
                <DropdownMenuItem onClick={() => onShowQR(session)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR Code
                </DropdownMenuItem>
              )}
              {canSync && (
                <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
                  <Database className="h-4 w-4 mr-2" />
                  {isSyncing ? 'Syncing...' : 'Sync WAHA'}
                </DropdownMenuItem>
              )}
              {canLogout && (
                <DropdownMenuItem onClick={handleLogout} className="text-orange-600 hover:text-orange-700">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout WhatsApp
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badge */}
        <Badge variant="outline" className={getStatusColor(session.status)}>
          {session.status.replace('_', ' ').toUpperCase()}
        </Badge>

        {/* Session Info */}
        <div className="space-y-2 text-sm">
          {session.phone_number && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium text-green-600">{session.phone_number}</span>
            </div>
          )}
          
          {session.webhook_url && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Webhook:</span>
              <span className="font-mono text-xs text-blue-600 truncate max-w-32">
                {session.webhook_url}
              </span>
            </div>
          )}

          {session.last_activity && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Last Activity:</span>
              <span className="text-xs">
                {new Date(session.last_activity).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canStart && (
            <Button
              size="sm"
              onClick={handleStart}
              disabled={isProcessing}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}

          {canStop && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              disabled={isProcessing}
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleRestart}
            disabled={isProcessing}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart
          </Button>

          {/* Sync button for active sessions */}
          {(session.status === 'WORKING' || session.status === 'working') && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="text-blue-600 hover:text-blue-700 border-blue-200"
            >
              <Database className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
              {isSyncing ? 'Syncing' : 'Sync'}
            </Button>
          )}

          {canShowQR && onShowQR && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onShowQR(session)}
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR
            </Button>
          )}

          {canLogout && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              disabled={isProcessing}
              className="text-orange-600 hover:text-orange-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{session.name}"? This action cannot be undone 
              and will permanently remove all session data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 