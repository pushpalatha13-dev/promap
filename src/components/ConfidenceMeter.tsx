import { memo } from 'react';
import { cn } from '@/lib/utils';

type Classification = 'human' | 'ai' | 'uncertain' | null;

interface ConfidenceMeterProps {
  confidence: number;
  classification: Classification;
  className?: string;
}

const ConfidenceMeter = memo(({ confidence, classification, className }: ConfidenceMeterProps) => {
  const getColorClasses = () => {
    switch (classification) {
      case 'human':
        return {
          ring: 'stroke-success',
          glow: 'glow-success',
          text: 'text-success',
          bg: 'bg-success/20',
        };
      case 'ai':
        return {
          ring: 'stroke-destructive',
          glow: 'glow-danger',
          text: 'text-destructive',
          bg: 'bg-destructive/20',
        };
      case 'uncertain':
        return {
          ring: 'stroke-warning',
          glow: 'glow-warning',
          text: 'text-warning',
          bg: 'bg-warning/20',
        };
      default:
        return {
          ring: 'stroke-muted-foreground',
          glow: '',
          text: 'text-muted-foreground',
          bg: 'bg-muted/20',
        };
    }
  };

  const colors = getColorClasses();
  const circumference = 2 * Math.PI * 45;
  const progress = (confidence / 100) * circumference;

  const getLabel = () => {
    switch (classification) {
      case 'human':
        return 'Human Voice';
      case 'ai':
        return 'AI Generated';
      case 'uncertain':
        return 'Uncertain';
      default:
        return 'Awaiting Input';
    }
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('relative w-40 h-40 rounded-full', colors.glow)}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            className="stroke-muted/30"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={cn(colors.ring, 'transition-all duration-700 ease-out')}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold font-mono', colors.text)}>
            {classification ? `${Math.round(confidence)}%` : '—'}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Confidence
          </span>
        </div>
        
        {/* Pulse effect */}
        {classification && (
          <div className={cn(
            'absolute inset-0 rounded-full animate-pulse-glow',
            colors.bg
          )} />
        )}
      </div>
      
      <div className={cn(
        'mt-4 px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wider',
        colors.bg,
        colors.text
      )}>
        {getLabel()}
      </div>
    </div>
  );
});

ConfidenceMeter.displayName = 'ConfidenceMeter';

export default ConfidenceMeter;
