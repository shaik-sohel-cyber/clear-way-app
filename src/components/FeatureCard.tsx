import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  onClick, 
  isActive = false,
  className 
}: FeatureCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full p-6 rounded-2xl border-2 transition-all duration-300",
        "bg-card hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary",
        "min-h-touch flex flex-col items-center gap-4 text-center",
        "active:scale-[0.98] ripple-effect",
        isActive 
          ? "border-primary glow-primary bg-primary/10" 
          : "border-border hover:border-primary/50",
        className
      )}
      aria-label={`${title}: ${description}`}
      aria-pressed={isActive}
    >
      <div className={cn(
        "p-4 rounded-xl transition-all duration-300",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground"
      )}>
        <Icon className="h-8 w-8" strokeWidth={2.5} />
      </div>
      
      <div className="space-y-1">
        <h3 className="text-accessible-lg">{title}</h3>
        <p className="text-muted-foreground text-base leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
