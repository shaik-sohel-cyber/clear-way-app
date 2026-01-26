import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    if (isListening) return "Listening... Say a command";
    return "Tap to start listening";
  };

  const getIcon = () => {
    if (isSpeaking) return <Volume2 className="h-10 w-10 animate-pulse" />;
    if (isProcessing) return <Loader2 className="h-10 w-10 animate-spin" />;
    if (isListening) return <Mic className="h-10 w-10" />;
    return <MicOff className="h-10 w-10" />;
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        {/* Pulsing rings when listening */}
        <AnimatePresence>
          {isListening && !isProcessing && !isSpeaking && (
            <>
              <motion.div 
                className="absolute inset-0 rounded-full bg-accent/30"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full bg-accent/20"
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.3 }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full bg-accent/10"
                initial={{ scale: 1, opacity: 0.2 }}
                animate={{ scale: 2.1, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.6 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Processing animation */}
        {isProcessing && (
          <motion.div 
            className="absolute inset-[-8px] rounded-full border-4 border-primary/30 border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        )}

        {/* Speaking animation */}
        {isSpeaking && (
          <motion.div 
            className="absolute inset-[-4px] rounded-full"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--success)), hsl(var(--accent)))',
              opacity: 0.3,
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}

        <Button
          variant="default"
          size="xl"
          className={cn(
            "relative z-10 rounded-full transition-all duration-300 min-h-[5rem] min-w-[5rem]",
            isListening && !isProcessing && !isSpeaking && "bg-accent text-accent-foreground shadow-lg shadow-accent/30",
            isProcessing && "bg-primary/80",
            isSpeaking && "bg-success text-success-foreground shadow-lg shadow-success/30"
          )}
          onClick={onToggle}
          aria-label={isListening ? "Stop listening" : "Start listening for voice commands"}
          aria-live="polite"
        >
          {getIcon()}
        </Button>
      </div>

      <motion.p 
        key={getStatusText()}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-muted-foreground text-lg"
        aria-live="polite"
      >
        {getStatusText()}
      </motion.p>

      {/* Sound wave visualization when listening */}
      <AnimatePresence>
        {isListening && !isProcessing && !isSpeaking && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SoundWave isActive className="scale-75" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
