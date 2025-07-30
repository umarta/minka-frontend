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

      // mode takeover
      if (takeoverStatus?.is_takeover) {
        await releaseTakeover(contact.id, user.id);
      } else {
        await setTakeover(contact.id, user.id);
      }
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
    if (!user?.id) return;
    try {
      await releaseTakeover(contact.id, user.id);
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
    badgeIcon = <Shield className="w-4 h-4 text-blue-600" />;
    badgeColor = 'bg-blue-100 text-blue-700';
    badgeText = 'AI';
    tooltipText = 'Auto-Reply AI Active';
  } else {
    badgeIcon = <User className="w-4 h-4 text-orange-600" />;
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
              className={`flex gap-1 items-center px-2 py-1 ml-2 text-xs font-medium rounded-full ${badgeColor}`}
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
              <h3 className="flex gap-2 items-center mb-2 font-bold"><Shield className="w-4 h-4 text-blue-600" />Auto-Reply Aktif</h3>
              <p className="mb-3 text-sm text-gray-600">Pesan sedang dijawab otomatis oleh AI. Klik Take Over untuk handle manual.</p>
              <Button onClick={handleSetTakeover} disabled={isLoading} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <User className="mr-2 w-4 h-4" />Take Over
              </Button>
            </div>
          ) : (
            <div>
              <h3 className="flex gap-2 items-center mb-2 font-bold"><User className="w-4 h-4 text-orange-600" />Manual Takeover Aktif</h3>
              <div className="flex gap-2 items-center mb-2">
                <Badge variant="secondary" className="text-orange-800 bg-orange-100">{isCurrentUserTakeover ? 'You' : badgeText}</Badge>
                <span className="text-sm text-gray-600">sedang handle chat ini</span>
              </div>
              {takeoverStatus?.takeover_at && (
                <div className="flex gap-1 items-center mb-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />{new Date(takeoverStatus.takeover_at).toLocaleTimeString()}
                </div>
              )}
              {takeoverStatus?.expires_at && (
                <Alert className="mb-2 bg-orange-50 border-orange-200">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">Takeover expires at {new Date(takeoverStatus.expires_at).toLocaleTimeString()}</AlertDescription>
                </Alert>
              )}
              {isCurrentUserTakeover ? (
                <Button onClick={handleReleaseTakeover} disabled={isLoading} size="sm" variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                  <MessageSquare className="mr-2 w-4 h-4" />Release Takeover
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