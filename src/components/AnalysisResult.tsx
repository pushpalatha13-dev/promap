import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, CheckCircle, HelpCircle, Languages, Fingerprint, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export interface AnalysisData {
  voiceType: 'human' | 'ai' | 'uncertain';
  confidence: number;
  language: string;
  artifacts: string[];
  recommendation: string;
  riskIndicators?: string[];
  callClassification?: 'safe' | 'spam' | 'fraud';
  transcription?: string;
}

interface AnalysisResultProps {
  data: AnalysisData | null;
  isLoading?: boolean;
  className?: string;
}

const AnalysisResult = memo(({ data, isLoading, className }: AnalysisResultProps) => {
  const [copied, setCopied] = useState(false);

  const getVoiceIcon = () => {
    if (!data) return <HelpCircle className="w-5 h-5" />;
    switch (data.voiceType) {
      case 'human':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'ai':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      default:
        return <HelpCircle className="w-5 h-5 text-warning" />;
    }
  };

  const getRiskIcon = () => {
    if (!data?.callClassification) return null;
    switch (data.callClassification) {
      case 'safe':
        return <Shield className="w-5 h-5 text-success" />;
      case 'spam':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'fraud':
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
    }
  };

  const copyJson = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className={cn('glass-card p-6', className)}>
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Analyzing audio...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn('glass-card p-6 text-center', className)}>
        <Fingerprint className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">
          Record or upload audio to begin analysis
        </p>
      </div>
    );
  }

  return (
    <div className={cn('glass-card overflow-hidden', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          {getVoiceIcon()}
          Analysis Results
        </h3>
        <Button variant="ghost" size="sm" onClick={copyJson} className="gap-1">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy JSON'}
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Main classification */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Voice Type</span>
            <p className={cn(
              'font-semibold capitalize',
              data.voiceType === 'human' && 'text-success',
              data.voiceType === 'ai' && 'text-destructive',
              data.voiceType === 'uncertain' && 'text-warning'
            )}>
              {data.voiceType === 'ai' ? 'AI Generated' : data.voiceType}
            </p>
          </div>
          
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Languages className="w-3 h-3" />
              Language
            </span>
            <p className="font-semibold">{data.language}</p>
          </div>
        </div>

        {/* Call Risk */}
        {data.callClassification && (
          <div className={cn(
            'p-3 rounded-lg flex items-center gap-3',
            data.callClassification === 'safe' && 'bg-success/10 border border-success/20',
            data.callClassification === 'spam' && 'bg-warning/10 border border-warning/20',
            data.callClassification === 'fraud' && 'bg-destructive/10 border border-destructive/20'
          )}>
            {getRiskIcon()}
            <div>
              <span className="text-xs text-muted-foreground uppercase">Call Risk</span>
              <p className={cn(
                'font-semibold capitalize',
                data.callClassification === 'safe' && 'text-success',
                data.callClassification === 'spam' && 'text-warning',
                data.callClassification === 'fraud' && 'text-destructive'
              )}>
                {data.callClassification}
              </p>
            </div>
          </div>
        )}

        {/* Artifacts */}
        {data.artifacts.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Detected Artifacts</span>
            <div className="flex flex-wrap gap-2">
              {data.artifacts.map((artifact, i) => (
                <span 
                  key={i} 
                  className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                >
                  {artifact}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Risk Indicators */}
        {data.riskIndicators && data.riskIndicators.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Risk Indicators</span>
            <div className="flex flex-wrap gap-2">
              {data.riskIndicators.map((indicator, i) => (
                <span 
                  key={i} 
                  className="px-2 py-1 text-xs rounded-full bg-destructive/20 text-destructive"
                >
                  {indicator}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Recommendation</span>
          <p className="text-sm mt-1">{data.recommendation}</p>
        </div>

        {/* JSON Output */}
        <details className="group">
          <summary className="text-xs text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors">
            Raw JSON Output
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-background/50 text-xs font-mono overflow-x-auto max-h-48">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
});

AnalysisResult.displayName = 'AnalysisResult';

export default AnalysisResult;
