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
  { id: 'describe', icon: Eye, label: 'Describe', gradient: 'from-primary to-orange-400' },
  { id: 'navigate', icon: Navigation, label: 'Navigate', gradient: 'from-accent to-teal-400' },
  { id: 'read', icon: FileText, label: 'Read', gradient: 'from-secondary to-blue-500' },
  { id: 'detect', icon: Camera, label: 'Detect', gradient: 'from-primary to-amber-500' },
  { id: 'location', icon: MapPin, label: 'Location', gradient: 'from-accent to-cyan-400' },
  { id: 'obstacle', icon: Shield, label: 'Check Path', gradient: 'from-warning to-yellow-400' },
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
                  isActive && `bg-gradient-to-r ${action.gradient} border-0 shadow-lg`
                )}
                onClick={() => onAction(action.id)}
                aria-pressed={isActive}
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: isActive ? Infinity : 0, duration: 1 }}
                >
                  <Icon className={cn("h-5 w-5", isActive && "text-white")} />
                </motion.div>
                <span className={cn("whitespace-nowrap font-medium", isActive && "text-white")}>
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
