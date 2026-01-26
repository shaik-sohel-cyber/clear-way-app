import { useEffect, useRef, useCallback, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useVisionAI } from '@/hooks/useVisionAI';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

interface UseAutoObstacleDetectionProps {
  captureImage: () => string | null;
  isActive: boolean;
}

export function useAutoObstacleDetection({ captureImage, isActive }: UseAutoObstacleDetectionProps) {
  const { settings } = useSettings();
  const { analyzeImage, isAnalyzing } = useVisionAI();
  const { speak } = useSpeechSynthesis();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [warningLevel, setWarningLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');

  const checkForObstacles = useCallback(async () => {
    if (isAnalyzing) return;

    const image = captureImage();
    if (!image) return;

    try {
      const result = await analyzeImage(image, 'obstacle');
      if (result) {
        // Parse warning level from response
        const lowerResult = result.toLowerCase();
        let level: 'none' | 'low' | 'medium' | 'high' = 'none';
        
        if (lowerResult.includes('immediate') || lowerResult.includes('danger') || lowerResult.includes('stop')) {
          level = 'high';
        } else if (lowerResult.includes('caution') || lowerResult.includes('careful') || lowerResult.includes('obstacle')) {
          level = 'medium';
        } else if (lowerResult.includes('clear') || lowerResult.includes('safe')) {
          level = 'low';
        }

        setWarningLevel(level);
        setLastWarning(result);

        // Only speak if there's a warning
        if (level === 'high') {
          // Vibrate for high alerts
          if (settings.hapticFeedback && 'vibrate' in navigator) {
            navigator.vibrate([500, 100, 500]);
          }
          speak(result);
        } else if (level === 'medium') {
          if (settings.hapticFeedback && 'vibrate' in navigator) {
            navigator.vibrate([200]);
          }
          speak(result);
        }
      }
    } catch (error) {
      console.error('Obstacle detection error:', error);
    }
  }, [captureImage, analyzeImage, isAnalyzing, speak, settings.hapticFeedback]);

  useEffect(() => {
    if (settings.autoObstacleWarning && isActive) {
      // Initial check
      checkForObstacles();

      // Set up interval
      intervalRef.current = setInterval(
        checkForObstacles,
        settings.obstacleWarningInterval * 1000
      );
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings.autoObstacleWarning, settings.obstacleWarningInterval, isActive, checkForObstacles]);

  const triggerManualCheck = useCallback(() => {
    checkForObstacles();
  }, [checkForObstacles]);

  return {
    lastWarning,
    warningLevel,
    isChecking: isAnalyzing,
    triggerManualCheck,
  };
}
