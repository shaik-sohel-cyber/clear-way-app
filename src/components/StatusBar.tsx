import { Battery, Wifi, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  batteryLevel?: number;
  isOnline?: boolean;
  className?: string;
}

export function StatusBar({ 
  batteryLevel = 85, 
  isOnline = true, 
  className 
}: StatusBarProps) {
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm border-b border-border",
      className
    )}>
      <div className="flex items-center gap-2">
        <Volume2 className="h-5 w-5 text-accent" />
        <span className="text-sm text-muted-foreground">Audio On</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Wifi className={cn("h-5 w-5", isOnline ? "text-success" : "text-destructive")} />
        </div>
        
        <div className="flex items-center gap-1">
          <Battery className={cn(
            "h-5 w-5",
            batteryLevel > 20 ? "text-success" : "text-warning"
          )} />
          <span className="text-sm text-muted-foreground">{batteryLevel}%</span>
        </div>
      </div>
    </div>
  );
}
