'use client';

import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AntiBlockingValidationResult } from '@/types';
import { cn } from '@/lib/utils';

interface AntiBlockingValidationProps {
  validation: AntiBlockingValidationResult | null;
  onDismiss?: () => void;
  className?: string;
}

export function AntiBlockingValidation({ validation, onDismiss, className }: AntiBlockingValidationProps) {
  if (!validation) return null;

  const { is_valid, errors, warnings, suggestions, risk_level } = validation;

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskIcon = (level?: string) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM':
        return <Info className="h-4 w-4" />;
      case 'LOW':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Risk Level Badge */}
      {risk_level && (
        <div className="flex items-center gap-2">
          <Badge className={cn('flex items-center gap-1', getRiskColor(risk_level))}>
            {getRiskIcon(risk_level)}
            {risk_level} Risk
          </Badge>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Errors */}
      {errors && errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-sm">
                  • {error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <Alert variant="default" className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <div key={index} className="text-sm">
                  • {warning}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="text-sm">
                  💡 {suggestion}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {is_valid && !errors?.length && !warnings?.length && (
        <Alert variant="default" className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Message validated successfully. Safe to send.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 