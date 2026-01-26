import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, History as HistoryIcon, Trash2 } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function History() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/')}
              className="touch-target"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-accessible-lg text-primary">History</h1>
          </div>
          <Button variant="ghost" size="icon" aria-label="Clear history">
            <Trash2 className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <motion.main 
        className="p-4 pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          variants={itemVariants}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="p-6 rounded-full bg-muted/50 mb-4">
            <HistoryIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No History Yet</h2>
          <p className="text-muted-foreground max-w-xs">
            Your conversation history will appear here when you enable "Save History" in settings.
          </p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => navigate('/settings')}
          >
            Enable History
          </Button>
        </motion.div>
      </motion.main>
    </div>
  );
}
