import { motion } from "framer-motion";
import { Eye, Navigation, FileText, Camera, MapPin, Shield, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConversationPromptProps {
  isListening: boolean;
  lastTranscript?: string;
  onActionSelect: (action: string) => void;
}

const actions = [
  { id: 'describe', icon: Eye, label: 'Describe Scene', description: 'What\'s around me?' },
  { id: 'navigate', icon: Navigation, label: 'Navigate', description: 'Help me get around' },
  { id: 'read', icon: FileText, label: 'Read Text', description: 'Read what I see' },
  { id: 'detect', icon: Camera, label: 'Detect Objects', description: 'What objects are here?' },
  { id: 'location', icon: MapPin, label: 'My Location', description: 'Where am I?' },
  { id: 'obstacle', icon: Shield, label: 'Check Path', description: 'Is it safe ahead?' },
];

export function ConversationPrompt({ isListening, lastTranscript, onActionSelect }: ConversationPromptProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center px-6 py-8"
    >
      {/* Listening indicator */}
      <motion.div 
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6",
          isListening ? "bg-accent/20" : "bg-muted"
        )}
        animate={isListening ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Mic className={cn(
          "h-10 w-10",
          isListening ? "text-accent" : "text-muted-foreground"
        )} />
      </motion.div>

      {/* Main prompt */}
      <motion.h2 
        className="text-2xl font-bold text-center mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isListening ? "I'm listening..." : "Tap to start"}
      </motion.h2>

      <motion.p 
        className="text-muted-foreground text-center mb-6 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {isListening 
          ? "Say a command like \"describe\" or tap an option below"
          : "Enable voice to start talking with VisionAI"
        }
      </motion.p>

      {/* Last heard */}
      {lastTranscript && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-muted/50 rounded-lg px-4 py-2 mb-6"
        >
          <p className="text-sm text-muted-foreground">
            Heard: <span className="text-foreground font-medium">"{lastTranscript}"</span>
          </p>
        </motion.div>
      )}

      {/* Quick action grid */}
      <motion.div 
        className="grid grid-cols-2 gap-3 w-full max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-accent/10 hover:border-accent"
                onClick={() => onActionSelect(action.id)}
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="font-medium text-sm">{action.label}</span>
                <span className="text-xs text-muted-foreground">{action.description}</span>
              </Button>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Voice hint */}
      <motion.p 
        className="text-sm text-muted-foreground mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        💡 Tip: Say <span className="text-accent font-medium">"Hey Vision, describe"</span> anytime
      </motion.p>
    </motion.div>
  );
}
