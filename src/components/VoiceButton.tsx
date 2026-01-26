import { useState, useCallback } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  onSpeechResult?: (text: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export function VoiceButton({ onSpeechResult, isProcessing = false, className }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      // Provide feedback for unsupported browsers
      onSpeechResult?.("Voice recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onSpeechResult?.(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      onSpeechResult?.("I couldn't hear you clearly. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isSupported, onSpeechResult]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Pulsing rings when listening */}
      {isListening && (
        <>
          <div className="absolute inset-0 rounded-full bg-primary/30 pulse-ring" />
          <div className="absolute inset-[-8px] rounded-full bg-primary/20 pulse-ring" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-[-16px] rounded-full bg-primary/10 pulse-ring" style={{ animationDelay: '0.6s' }} />
        </>
      )}
      
      <Button
        variant={isListening ? "accent" : "hero"}
        size="touch-lg"
        className={cn(
          "relative z-10 rounded-full transition-all duration-300",
          isListening && "glow-accent",
          isProcessing && "opacity-70 cursor-wait"
        )}
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        aria-label={isListening ? "Stop listening" : "Start voice command"}
        aria-live="polite"
      >
        {isProcessing ? (
          <Volume2 className="h-10 w-10 animate-pulse" />
        ) : isListening ? (
          <MicOff className="h-10 w-10" />
        ) : (
          <Mic className="h-10 w-10" />
        )}
      </Button>
    </div>
  );
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
