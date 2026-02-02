import { useCallback, useState, useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

interface SpeechCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const { settings } = useSettings();
  const callbacksRef = useRef<SpeechCallbacks>({});
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
    
    // Preload voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const speak = useCallback((text: string, callbacks?: SpeechCallbacks): Promise<void> => {
    return new Promise((resolve) => {
      if (!isSupported) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      callbacksRef.current = callbacks || {};

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply user settings
      utterance.rate = settings.voiceSpeed;
      utterance.pitch = settings.voicePitch;
      utterance.volume = settings.voiceVolume;

      // Try to use a clear, natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        voice => voice.name.includes('Samantha') || 
                 voice.name.includes('Google') ||
                 voice.name.includes('Natural') ||
                 voice.lang.startsWith('en')
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        callbacksRef.current.onStart?.();
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        callbacksRef.current.onEnd?.();
        resolve();
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        callbacksRef.current.onEnd?.();
        resolve();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [isSupported, settings.voiceSpeed, settings.voicePitch, settings.voiceVolume]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      callbacksRef.current.onEnd?.();
    }
  }, [isSupported]);

  return { speak, stop, isSpeaking, isSupported };
}
