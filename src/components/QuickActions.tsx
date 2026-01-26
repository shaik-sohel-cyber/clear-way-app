import { motion } from "framer-motion";
import { Eye, Navigation, FileText, Camera, MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onAction: (action: string) => void;
  activeMode?: string;
  className?: string;
}

const actions = [
  { id: 'describe', icon: Eye, label: 'Describe', voiceHint: '"describe"' },
  { id: 'navigate', icon: Navigation, label: 'Navigate', voiceHint: '"navigate"' },
  { id: 'read', icon: FileText, label: 'Read', voiceHint: '"read"' },
  { id: 'detect', icon: Camera, label: 'Detect', voiceHint: '"detect"' },
  { id: 'location', icon: MapPin, label: 'Location', voiceHint: '"location"' },
  { id: 'obstacle', icon: Shield, label: 'Check Path', voiceHint: '"obstacle"' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function QuickActions({ onAction, activeMode, className }: QuickActionsProps) {
  return (
    <motion.div 
      className={cn("px-4 py-3 bg-card/80 backdrop-blur-lg border-t border-border", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = activeMode === action.id;
          
          return (
            <motion.div key={action.id} variants={itemVariants}>
              <Button
                variant={isActive ? "default" : "outline"}
                size="lg"
                className={cn(
                  "flex-shrink-0 gap-2 rounded-xl transition-all duration-300",
                  isActive && "bg-primary shadow-lg"
                )}
                onClick={() => onAction(action.id)}
                aria-pressed={isActive}
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: isActive ? Infinity : 0, duration: 1 }}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-primary-foreground")} />
                </motion.div>
                <span className={cn("whitespace-nowrap font-medium", isActive && "text-primary-foreground")}>
                  {action.label}
                </span>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
