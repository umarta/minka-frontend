'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NotificationToggleProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function NotificationToggle({ 
  className = '', 
  variant = 'ghost', 
  size = 'sm' 
}: NotificationToggleProps) {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Load notification preference from localStorage
    const saved = localStorage.getItem('notification-sound-enabled');
    if (saved !== null) {
      setIsEnabled(saved === 'true');
    }
  }, []);

  const toggleNotification = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    localStorage.setItem('notification-sound-enabled', newValue.toString());
    
    // Update global function
    if (typeof window !== 'undefined') {
      if (newValue) {
        window.playNotificationSound = () => {
          try {
            const audio = new Audio('/notification.wav');
            audio.volume = 0.5;
            audio.play().catch(e => {
              console.warn('Failed to play notification sound:', e);
            });
          } catch (e) {
            console.warn('Failed to create notification sound:', e);
          }
        };
      } else {
        window.playNotificationSound = () => {
          // Do nothing when disabled
          console.log('[Notification] Sound disabled');
        };
      }
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={toggleNotification}
            className={className}
          >
            {isEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isEnabled ? 'Disable notification sound' : 'Enable notification sound'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 