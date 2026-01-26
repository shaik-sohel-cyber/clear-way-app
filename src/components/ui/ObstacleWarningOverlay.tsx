import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ObstacleWarningOverlayProps {
  warningLevel: 'none' | 'low' | 'medium' | 'high';
  message?: string;
  isVisible: boolean;
}

export function ObstacleWarningOverlay({ warningLevel, message, isVisible }: ObstacleWarningOverlayProps) {
  if (!isVisible || warningLevel === 'none') return null;

  const config = {
    low: {
      icon: CheckCircle,
      bg: 'bg-success/20',
      border: 'border-success/50',
      text: 'text-success',
      label: 'Path Clear'
    },
    medium: {
      icon: Shield,
      bg: 'bg-warning/20',
      border: 'border-warning/50',
      text: 'text-warning',
      label: 'Caution'
    },
    high: {
      icon: AlertTriangle,
      bg: 'bg-destructive/20',
      border: 'border-destructive/50',
      text: 'text-destructive',
      label: 'Warning!'
    }
  };

  const { icon: Icon, bg, border, text, label } = config[warningLevel];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "absolute top-4 left-4 right-4 z-50 rounded-2xl p-4 backdrop-blur-md border-2",
          bg,
          border
        )}
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={warningLevel === 'high' ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >
            <Icon className={cn("h-8 w-8", text)} />
          </motion.div>
          <div className="flex-1">
            <p className={cn("font-bold text-lg", text)}>{label}</p>
            {message && (
              <p className="text-foreground text-base mt-1 line-clamp-2">{message}</p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
