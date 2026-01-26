import { motion } from "framer-motion";
import { Home, Settings, History, Info } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[4.5rem]",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="h-6 w-6 relative z-10" />
              <span className="text-xs font-medium relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
