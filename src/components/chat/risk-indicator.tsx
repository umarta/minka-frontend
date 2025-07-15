'use client';

import { AlertTriangle, Shield, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContactRiskAssessment } from '@/types';
import { cn } from '@/lib/utils';

interface RiskIndicatorProps {
  risk: ContactRiskAssessment | null;
  onViewDetails?: () => void;
  className?: string;
  compact?: boolean;
}

export function RiskIndicator({ risk, onViewDetails, className, compact = false }: RiskIndicatorProps) {
  if (!risk) return null;

  const { risk_level, risk_score, factors, is_blocking_risk, hourly_count, daily_count } = risk;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500 text-white border-red-600';
      case 'HIGH': return 'bg-orange-500 text-white border-orange-600';
      case 'MEDIUM': return 'bg-yellow-500 text-black border-yellow-600';
      case 'LOW': return 'bg-green-500 text-white border-green-600';
      default: return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL':
      case 'HIGH':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM':
        return <Info className="h-4 w-4" />;
      case 'LOW':
        return <Shield className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getRiskDescription = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'Critical risk - Stop messaging immediately';
      case 'HIGH': return 'High risk - Consider pausing messages';
      case 'MEDIUM': return 'Medium risk - Reduce message frequency';
      case 'LOW': return 'Low risk - Safe to continue';
      default: return 'Unknown risk level';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 gap-1',
                getRiskColor(risk_level),
                className
              )}
              onClick={onViewDetails}
            >
              {getRiskIcon(risk_level)}
              <span className="text-xs font-medium">{risk_score}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{risk_level} Risk ({risk_score}/100)</div>
              <div className="text-xs">{getRiskDescription(risk_level)}</div>
              {factors.length > 0 && (
                <div className="text-xs">
                  <div className="font-medium">Factors:</div>
                  {factors.slice(0, 2).map((factor, index) => (
                    <div key={index}>• {factor}</div>
                  ))}
                  {factors.length > 2 && <div>• ...and {factors.length - 2} more</div>}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={cn('flex items-center gap-1', getRiskColor(risk_level))}>
            {getRiskIcon(risk_level)}
            {risk_level} Risk
          </Badge>
          <span className="text-sm font-medium">({risk_score}/100)</span>
        </div>
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            Details
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {getRiskDescription(risk_level)}
      </div>

      {is_blocking_risk && (
        <div className="text-xs text-red-600 font-medium">
          ⚠️ Blocking risk detected
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted p-2 rounded">
          <div className="font-medium">Hourly</div>
          <div>{hourly_count} messages</div>
        </div>
        <div className="bg-muted p-2 rounded">
          <div className="font-medium">Daily</div>
          <div>{daily_count} messages</div>
        </div>
      </div>

      {factors.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium">Risk Factors:</div>
          <div className="space-y-1">
            {factors.slice(0, 3).map((factor, index) => (
              <div key={index} className="text-xs text-muted-foreground">
                • {factor}
              </div>
            ))}
            {factors.length > 3 && (
              <div className="text-xs text-muted-foreground">
                • ...and {factors.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 