import { motion } from "framer-motion";
import { Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { toast } from "@/hooks/use-toast";

interface EmergencyButtonProps {
  className?: string;
}

export function EmergencyButton({ className }: EmergencyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { settings } = useSettings();

  const handlePressStart = () => {
    setIsPressed(true);
    let progress = 0;
    
    if (settings.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    intervalRef.current = setInterval(() => {
      progress += 5;
      setHoldProgress(progress);
      if (progress >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        
        // Trigger emergency
        if (settings.hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        toast({
          variant: "destructive",
          title: "Emergency Alert",
          description: "Emergency services would be contacted in a real scenario.",
        });
        
        setIsPressed(false);
        setHoldProgress(0);
      }
    }, 40);
  };

  const handlePressEnd = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPressed(false);
    setHoldProgress(0);
  };

  return (
    <motion.div 
      className={cn("relative", className)}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant="destructive"
        className={cn(
          "w-full rounded-2xl relative overflow-hidden h-16 text-lg font-bold",
          "bg-gradient-to-r from-destructive to-red-500",
          "shadow-lg shadow-destructive/30",
          isPressed && "from-red-600 to-red-700"
        )}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        aria-label="Hold for 2 seconds to call emergency services"
      >
        {/* Progress overlay */}
        <motion.div 
          className="absolute inset-0 bg-white/20"
          style={{ width: `${holdProgress}%` }}
          transition={{ duration: 0.05 }}
        />
        
        <div className="relative flex items-center gap-3">
          <motion.div
            animate={isPressed ? { 
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0]
            } : {}}
            transition={{ repeat: isPressed ? Infinity : 0, duration: 0.5 }}
          >
            {isPressed ? (
              <Phone className="h-7 w-7" />
            ) : (
              <AlertTriangle className="h-7 w-7" />
            )}
          </motion.div>
          
          <div className="text-left">
            <div className="font-bold text-lg">
              {isPressed ? `Calling in ${Math.ceil((100 - holdProgress) / 50)}...` : "Emergency"}
            </div>
            <div className="text-xs opacity-90">Hold 2 seconds to call</div>
          </div>
        </div>
      </Button>
    </motion.div>
  );
}
