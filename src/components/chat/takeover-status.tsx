'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, User, Shield, MessageSquare } from 'lucide-react';
import { useContactStore } from '@/lib/stores/contact';
import { useAuthStore } from '@/lib/stores/auth';
import { Contact } from '@/types';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';

interface TakeoverStatusProps {
  contact: Contact;
  onTakeoverChange?: () => void;
}

export function TakeoverStatus({ contact, onTakeoverChange }: TakeoverStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [takeoverStatus, setTakeoverStatus] = useState<any>(null);
  const { setTakeover, releaseTakeover, getTakeoverStatus } = useContactStore();
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (contact.id) {
      loadTakeoverStatus();
    }
  }, [contact.id]);

  const loadTakeoverStatus = async () => {
    try {
      const status = await getTakeoverStatus(contact.id);
      setTakeoverStatus(status);
    } catch (error) {
      console.error('Failed to load takeover status:', error);
    }
  };

  const handleSetTakeover = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      await setTakeover(contact.id, user.id);
      await loadTakeoverStatus();
      onTakeoverChange?.();
    } catch (error) {
      console.error('Failed to set takeover:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleaseTakeover = async () => {
    setIsLoading(true);
    try {
      await releaseTakeover(contact.id);
      await loadTakeoverStatus();
      onTakeoverChange?.();
    } catch (error) {
      console.error('Failed to release takeover:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isInTakeover = contact.is_takeover_by_admin || takeoverStatus?.is_takeover;
  const isCurrentUserTakeover = takeoverStatus?.takeover_admin_id === user?.id;
  const canTakeOver = !isInTakeover || isCurrentUserTakeover;

  // BADGE + MODAL (untuk header)
  let badgeIcon, badgeColor, badgeText, tooltipText;
  if (!isInTakeover) {
    badgeIcon = <Shield className="h-4 w-4 text-blue-600" />;
    badgeColor = 'bg-blue-100 text-blue-700';
    badgeText = 'AI';
    tooltipText = 'Auto-Reply AI Active';
  } else {
    badgeIcon = <User className="h-4 w-4 text-orange-600" />;
    badgeColor = 'bg-orange-100 text-orange-700';
    badgeText = takeoverStatus?.takeover_admin?.username || 'Admin';
    tooltipText = isCurrentUserTakeover ? 'Anda takeover' : `Ditakeover oleh ${badgeText}`;
  }

  return (
    <>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`ml-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}
              onClick={() => setModalOpen(true)}
              style={{ minWidth: 32 }}
              type="button"
            >
              {badgeIcon}
              <span>{badgeText}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
        <DialogContent>
          <DialogTitle>Takeover Status</DialogTitle>
          <DialogClose asChild>
            <button className="absolute top-4 right-4" aria-label="Close">×</button>
          </DialogClose>
          {!isInTakeover ? (
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2"><Shield className="h-4 w-4 text-blue-600" />Auto-Reply Aktif</h3>
              <p className="text-sm text-gray-600 mb-3">Pesan sedang dijawab otomatis oleh AI. Klik Take Over untuk handle manual.</p>
              <Button onClick={handleSetTakeover} disabled={isLoading} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <User className="h-4 w-4 mr-2" />Take Over
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2"><User className="h-4 w-4 text-orange-600" />Manual Takeover Aktif</h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">{isCurrentUserTakeover ? 'You' : badgeText}</Badge>
                <span className="text-sm text-gray-600">sedang handle chat ini</span>
              </div>
              {takeoverStatus?.takeover_at && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Clock className="h-3 w-3" />{new Date(takeoverStatus.takeover_at).toLocaleTimeString()}
                </div>
              )}
              {takeoverStatus?.expires_at && (
                <Alert className="border-orange-200 bg-orange-50 mb-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">Takeover expires at {new Date(takeoverStatus.expires_at).toLocaleTimeString()}</AlertDescription>
                </Alert>
              )}
              {isCurrentUserTakeover ? (
                <Button onClick={handleReleaseTakeover} disabled={isLoading} size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100">
                  <MessageSquare className="h-4 w-4 mr-2" />Release Takeover
                </Button>
              ) : (
                <p className="text-sm text-gray-600">Admin lain sedang handle chat ini. Anda bisa takeover jika sudah dilepas.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 