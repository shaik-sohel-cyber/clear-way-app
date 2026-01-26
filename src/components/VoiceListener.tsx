import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SoundWave } from "./SoundWave";
import { cn } from "@/lib/utils";

interface VoiceListenerProps {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
  className?: string;
}

export function VoiceListener({ 
  isListening, 
  isProcessing, 
  isSpeaking, 
  onToggle,
  className 
}: VoiceListenerProps) {
  const getStatusText = () => {
    if (isSpeaking) return "Speaking...";
    if (isProcessing) return "Analyzing...";
    if (isListening) return 'Listening for "Hey Vision"...';
    return 'Tap to start listening';
  };

  const getIcon = () => {
    if (isSpeaking) return <Volume2 className="h-10 w-10 animate-pulse" />;
    if (isProcessing) return <SoundWave isActive className="scale-150" />;
    if (isListening) return <Mic className="h-10 w-10" />;
    return <MicOff className="h-10 w-10" />;
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        {/* Pulsing rings when listening */}
        {isListening && !isProcessing && !isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-accent/30 pulse-ring" />
            <div className="absolute inset-[-8px] rounded-full bg-accent/20 pulse-ring" style={{ animationDelay: '0.3s' }} />
            <div className="absolute inset-[-16px] rounded-full bg-accent/10 pulse-ring" style={{ animationDelay: '0.6s' }} />
          </>
        )}

        {/* Processing animation */}
        {isProcessing && (
          <div className="absolute inset-[-8px] rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        )}

        <Button
          variant="default"
          size="xl"
          className={cn(
            "relative z-10 rounded-full transition-all duration-300 min-h-[5rem] min-w-[5rem]",
            isListening && "bg-accent text-accent-foreground glow-accent",
            isProcessing && "bg-primary/80",
            isSpeaking && "bg-success text-success-foreground"
          )}
          onClick={onToggle}
          aria-label={isListening ? "Stop listening" : "Start listening for voice commands"}
          aria-live="polite"
        >
          {getIcon()}
        </Button>
      </div>

      <p className="text-center text-muted-foreground text-lg" aria-live="polite">
        {getStatusText()}
      </p>
    </div>
  );
}
