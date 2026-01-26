import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VisionMode = 'describe' | 'navigate' | 'read' | 'detect' | 'location' | 'obstacle' | 'general';

interface AnalysisResult {
  analysis: string;
  mode: VisionMode;
  timestamp: string;
}

interface UseVisionAIReturn {
  isAnalyzing: boolean;
  error: string | null;
  lastResult: AnalysisResult | null;
  analyzeImage: (imageData: string, mode: VisionMode, query?: string) => Promise<string | null>;
  clearError: () => void;
}

export function useVisionAI(): UseVisionAIReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AnalysisResult | null>(null);

  const analyzeImage = useCallback(async (
    imageData: string, 
    mode: VisionMode, 
    query?: string
  ): Promise<string | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log(`Analyzing image with mode: ${mode}`);

      const { data, error: invokeError } = await supabase.functions.invoke('vision-analyze', {
        body: { 
          image: imageData, 
          mode, 
          query 
        },
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to analyze image');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const result: AnalysisResult = {
        analysis: data.analysis,
        mode: data.mode,
        timestamp: data.timestamp,
      };

      setLastResult(result);
      console.log('Analysis complete:', result.analysis.substring(0, 100) + '...');
      
      return result.analysis;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      console.error('Vision AI error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAnalyzing,
    error,
    lastResult,
    analyzeImage,
    clearError,
  };
}
