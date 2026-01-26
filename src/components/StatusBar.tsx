import { motion } from "framer-motion";
import { Battery, Wifi, WifiOff, Volume2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { useEffect, useState } from "react";

interface StatusBarProps {
  batteryLevel?: number;
  isOnline?: boolean;
  className?: string;
}

export function StatusBar({ 
  batteryLevel: propBatteryLevel, 
  isOnline = true, 
  className 
}: StatusBarProps) {
  const { settings } = useSettings();
  const [batteryLevel, setBatteryLevel] = useState(propBatteryLevel ?? 100);

  // Get real battery level if available
  useEffect(() => {
    if (propBatteryLevel !== undefined) return;
    
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {
        // Battery API not available
      });
    }
  }, [propBatteryLevel]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur-lg border-b border-border",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-accent" />
          <span className="text-xs text-muted-foreground">Audio On</span>
        </div>
        
        {settings.autoObstacleWarning && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-warning/10">
            <Shield className="h-3.5 w-3.5 text-warning" />
            <span className="text-xs text-warning font-medium">Auto</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <motion.div 
          className="flex items-center gap-1"
          animate={!isOnline ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ repeat: !isOnline ? Infinity : 0, duration: 1 }}
        >
          {isOnline ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-warning" />
          )}
        </motion.div>
        
        <div className="flex items-center gap-1.5">
          <Battery className={cn(
            "h-4 w-4",
            batteryLevel > 20 ? "text-success" : batteryLevel > 10 ? "text-warning" : "text-destructive"
          )} />
          <span className="text-xs text-muted-foreground font-medium">{batteryLevel}%</span>
        </div>
      </div>
    </motion.div>
  );
}
