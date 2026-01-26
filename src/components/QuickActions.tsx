import { Eye, Navigation, FileText, AlertTriangle, Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onAction: (action: string) => void;
  activeMode?: string;
  className?: string;
}

const actions = [
  { id: 'describe', icon: Eye, label: 'Describe Scene', color: 'primary' },
  { id: 'navigate', icon: Navigation, label: 'Navigate', color: 'accent' },
  { id: 'read', icon: FileText, label: 'Read Text', color: 'secondary' },
  { id: 'detect', icon: Camera, label: 'Detect Objects', color: 'primary' },
  { id: 'location', icon: MapPin, label: 'Where Am I?', color: 'accent' },
  { id: 'emergency', icon: AlertTriangle, label: 'Emergency', color: 'destructive' },
];

export function QuickActions({ onAction, activeMode, className }: QuickActionsProps) {
  return (
    <div className={cn("px-4 py-3 bg-card/80 backdrop-blur-sm border-t border-border", className)}>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {actions.map((action) => {
          const Icon = action.icon;
          const isActive = activeMode === action.id;
          const isEmergency = action.id === 'emergency';
          
          return (
            <Button
              key={action.id}
              variant={isEmergency ? "destructive" : isActive ? "accent" : "outline"}
              size="lg"
              className={cn(
                "flex-shrink-0 gap-2",
                isActive && !isEmergency && "glow-accent"
              )}
              onClick={() => onAction(action.id)}
              aria-pressed={isActive}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
