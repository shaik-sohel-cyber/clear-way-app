import { Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface EmergencyButtonProps {
  className?: string;
}

export function EmergencyButton({ className }: EmergencyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  const handlePressStart = () => {
    setIsPressed(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setHoldProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Trigger emergency call
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }
        // In production, this would initiate an emergency call
        alert("Emergency services would be contacted. In a real app, this would call 911.");
        setIsPressed(false);
        setHoldProgress(0);
      }
    }, 50);
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    setHoldProgress(0);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="emergency"
        size="touch-lg"
        className={cn(
          "w-full rounded-2xl relative overflow-hidden",
          isPressed && "scale-[0.98]"
        )}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        aria-label="Hold for 2 seconds to call emergency services"
      >
        {/* Progress overlay */}
        <div 
          className="absolute inset-0 bg-destructive/30 transition-all duration-100"
          style={{ width: `${holdProgress}%` }}
        />
        
        <div className="relative flex items-center gap-3">
          {isPressed ? (
            <Phone className="h-8 w-8 animate-pulse" />
          ) : (
            <AlertTriangle className="h-8 w-8" />
          )}
          <div className="text-left">
            <div className="font-bold text-xl">Emergency</div>
            <div className="text-sm opacity-90">Hold 2 seconds to call</div>
          </div>
        </div>
      </Button>
    </div>
  );
}
