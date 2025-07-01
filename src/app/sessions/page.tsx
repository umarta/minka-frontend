'use client';

import { useEffect, useState } from 'react';
import { Plus, Smartphone, Activity, AlertCircle, Search, Filter, RefreshCw, Zap } from 'lucide-react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

import { SessionCard } from '@/components/sessions/session-card';
import { QRCodeDisplay } from '@/components/sessions/qr-code-display';
import { CreateSessionDialog } from '@/components/sessions/create-session-dialog';
import { EditSessionDialog } from '@/components/sessions/edit-session-dialog';
import { useSessionStore } from '@/lib/stores/session';
import { Session, SessionStatus } from '@/types';

export default function SessionsPage() {
  const { 
    sessions, 
    isLoading, 
    error, 
    fetchSessions, 
    syncSessions,
    clearError,
    selectSession,
    selectedSession 
  } = useSessionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrSession, setQrSession] = useState<Session | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
    setLastRefresh(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter(session => {
    if (!session) return false;
    
    const searchableText = [
      session.name || '',
      session.session_name || '',
      session.phone_number || ''
    ].join(' ').toLowerCase();
    
    const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group sessions by status
  const sessionsByStatus = filteredSessions.reduce((acc, session) => {
    const status = session.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(session);
    return acc;
  }, {} as Record<SessionStatus, Session[]>);

  const getStatusCount = (status: SessionStatus) => {
    return sessions.filter(s => s && s.status === status).length;
  };

  const handleShowQR = (session: Session) => {
    setQrSession(session);
    setShowQRDialog(true);
  };

  const handleEdit = (session: Session) => {
    setEditSession(session);
    setShowEditDialog(true);
  };

  const handleSessionCreated = () => {
    fetchSessions(); // Refresh sessions list
    setLastRefresh(new Date());
  };

  const handleSessionUpdated = () => {
    fetchSessions(); // Refresh sessions list
    setLastRefresh(new Date());
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncSessions();
      setLastRefresh(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = () => {
    fetchSessions();
    setLastRefresh(new Date());
  };

  if (isLoading && sessions.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Sessions</h1>
              <p className="text-gray-600">Manage your WhatsApp bot sessions and QR codes</p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Sessions</h1>
            <p className="text-gray-600">
              Manage your WhatsApp bot sessions and QR codes
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs text-blue-600">
                <Activity className="h-3 w-3 mr-1" />
                Real-time updates via WebSocket
              </Badge>
              <Badge variant="outline" className="text-xs">
                Last refresh: {lastRefresh.toLocaleTimeString()}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Refresh sessions
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isSyncing}
                  >
                    <Zap className={`h-4 w-4 ${isSyncing ? 'animate-pulse' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Sync with WAHA server
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <CreateSessionDialog onSuccess={handleSessionCreated} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                </div>
                <Smartphone className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{getStatusCount('working')}</p>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{getStatusCount('scan_qr_code')}</p>
                </div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Starting</p>
                  <p className="text-2xl font-bold text-blue-600">{getStatusCount('starting')}</p>
                </div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{getStatusCount('failed')}</p>
                </div>
                <div className="w-3 h-3 bg-red-400 rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search sessions by name, identifier, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value: SessionStatus | 'all') => setStatusFilter(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="working">Working</SelectItem>
              <SelectItem value="scan_qr_code">Scan QR Code</SelectItem>
              <SelectItem value="starting">Starting</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {sessions.length === 0 ? 'No sessions yet' : 'No sessions match your filter'}
            </h3>
            <p className="text-gray-500 mb-6">
              {sessions.length === 0 
                ? 'Create your first WhatsApp session to get started.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {sessions.length === 0 && (
              <CreateSessionDialog 
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Session
                  </Button>
                }
                onSuccess={handleSessionCreated}
              />
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onShowQR={handleShowQR}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>WhatsApp QR Code</DialogTitle>
            </DialogHeader>
            {qrSession && (
              <QRCodeDisplay session={qrSession} />
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Session Dialog */}
        <EditSessionDialog
          session={editSession}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={handleSessionUpdated}
        />
      </div>
    </MainLayout>
  );
} 