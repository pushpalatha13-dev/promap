import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AnalysisData } from '@/components/AnalysisResult';

interface UseAudioAnalysisReturn {
  analyze: (audioBlob: Blob) => Promise<void>;
  isAnalyzing: boolean;
  result: AnalysisData | null;
  error: string | null;
  reset: () => void;
}

export function useAudioAnalysis(): UseAudioAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      // Call edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-voice`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            audio: audioBase64,
            mimeType: audioBlob.type || 'audio/webm',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze audio');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    analyze,
    isAnalyzing,
    result,
    error,
    reset,
  };
}
