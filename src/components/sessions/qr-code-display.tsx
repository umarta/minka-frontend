'use client';

import { useState, useEffect } from 'react';
import { QrCode, RefreshCw, Smartphone, CheckCircle, XCircle, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Session, SessionStatus } from '@/types';
import { useSessionStore } from '@/lib/stores/session';

interface QRCodeDisplayProps {
  session: Session;
  size?: number;
}

export function QRCodeDisplay({ session, size = 256 }: QRCodeDisplayProps) {
  const { getQRCode, qrCodes, error, startSession } = useSessionStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const qrCode = qrCodes[session.id];

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800';
      case 'scan_qr_code':
        return 'bg-yellow-100 text-yellow-800';
      case 'starting':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case 'working':
        return <CheckCircle className="h-4 w-4" />;
      case 'scan_qr_code':
        return <QrCode className="h-4 w-4" />;
      case 'starting':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'stopped':
        return <XCircle className="h-4 w-4" />;
      default:
        return <QrCode className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: SessionStatus) => {
    switch (status) {
      case 'working':
        return 'Connected';
      case 'scan_qr_code':
        return 'Scan QR Code';
      case 'starting':
        return 'Starting...';
      case 'failed':
        return 'Failed';
      case 'stopped':
        return 'Stopped';
      default:
        return status;
    }
  };

  const handleRefreshQR = async () => {
    setIsLoading(true);
    try {
      await getQRCode(session.session_name);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await startSession(session.session_name);
    } finally {
      setIsStarting(false);
    }
  };

  // Auto-refresh QR code when status is scan_qr_code
  useEffect(() => {
    if (session.status === 'scan_qr_code' && autoRefresh && !qrCode) {
      handleRefreshQR();
    }
  }, [session.status, autoRefresh]);

  // Auto-refresh every 30 seconds when waiting for scan
  useEffect(() => {
    if (session.status === 'scan_qr_code' && autoRefresh) {
      const interval = setInterval(() => {
        handleRefreshQR();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [session.status, autoRefresh]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            {session.name}
          </div>
          <Badge className={getStatusColor(session.status)}>
            {getStatusIcon(session.status)}
            <span className="ml-1">{getStatusText(session.status)}</span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Session: {session.session_name}
          {session.phone_number && (
            <span className="block text-sm text-green-600">
              📱 {session.phone_number}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.status === 'working' ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              WhatsApp Connected!
            </h3>
            <p className="text-sm text-gray-500">
              Your WhatsApp session is active and ready to receive messages.
            </p>
          </div>
        ) : session.status === 'scan_qr_code' ? (
          <div className="text-center space-y-4">
            {qrCode ? (
              <div className="relative">
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                  <img 
                    src={qrCode} 
                    alt="WhatsApp QR Code"
                    className="mx-auto"
                    style={{ width: size, height: size }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -top-2 -right-2 bg-white hover:bg-gray-100"
                  onClick={handleRefreshQR}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            ) : (
              <div 
                className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
                style={{ width: size, height: size }}
              >
                {isLoading ? (
                  <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                ) : (
                  <QrCode className="h-8 w-8 text-gray-400" />
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                Scan QR Code
              </h3>
              <p className="text-sm text-gray-500">
                Open WhatsApp on your phone and scan this QR code to connect.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshQR}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh QR
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </div>
        ) : session.status === 'starting' ? (
          <div className="text-center py-8">
            <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Starting Session...
            </h3>
            <p className="text-sm text-gray-500">
              Please wait while we initialize your WhatsApp session.
            </p>
          </div>
        ) : session.status === 'failed' ? (
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Connection Failed
            </h3>
            <p className="text-sm text-gray-500">
              Unable to establish WhatsApp connection. Please try restarting the session.
            </p>
            <div className="mt-4">
              <Button
                variant="default"
                onClick={handleStart}
                disabled={isStarting}
                className="w-full"
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Session Stopped
            </h3>
            <p className="text-sm text-gray-500">
              WhatsApp session is currently stopped. Start the session to begin.
            </p>
            <div className="mt-4">
              <Button
                variant="default"
                onClick={handleStart}
                disabled={isStarting}
                className="w-full"
              >
                {isStarting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {session.last_activity && (
          <div className="text-xs text-gray-500 text-center">
            Last activity: {new Date(session.last_activity).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 