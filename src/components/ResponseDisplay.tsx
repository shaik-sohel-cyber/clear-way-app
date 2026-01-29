import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SoundWave } from "./SoundWave";
import { Bot, User, Sparkles } from "lucide-react";
import { useRef, useEffect } from "react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ResponseDisplayProps {
  messages: Message[];
  isProcessing?: boolean;
  className?: string;
}

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring" as const, bounce: 0.3 }
  },
  exit: { opacity: 0, y: -10, scale: 0.95 }
};

export function ResponseDisplay({ messages, isProcessing = false, className }: ResponseDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  return (
    <div 
      ref={scrollRef}
      className={cn(
        "flex-1 p-4 overflow-y-auto space-y-3",
        className
      )}
      role="log"
      aria-label="Conversation"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {messages.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <p className="text-muted-foreground text-center">Say a command to start</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <motion.div 
                    className="flex-shrink-0 p-2.5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <Bot className="h-6 w-6 text-primary" />
                  </motion.div>
                )}
                
                <motion.div 
                  className={cn(
                    "max-w-[85%] p-4 rounded-2xl shadow-lg",
                    message.role === 'user' 
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md" 
                      : "bg-card/90 backdrop-blur-sm border border-border rounded-bl-md"
                  )}
                  whileHover={{ scale: 1.01 }}
                >
                  <p className="text-lg leading-relaxed">{message.content}</p>
                  <p className="text-xs mt-2 opacity-60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
                
                {message.role === 'user' && (
                  <motion.div 
                    className="flex-shrink-0 p-2.5 rounded-full bg-secondary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <User className="h-6 w-6 text-secondary-foreground" />
                  </motion.div>
                )}
              </motion.div>
            ))}
            
            {isProcessing && (
              <motion.div 
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                className="flex gap-3"
              >
                <div className="flex-shrink-0 p-2.5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <Sparkles className="h-6 w-6 text-primary" />
                  </motion.div>
                </div>
                <div className="bg-card/90 backdrop-blur-sm border border-border rounded-2xl rounded-bl-md p-4 flex items-center gap-3">
                  <SoundWave isActive />
                  <span className="text-lg text-muted-foreground">Analyzing scene...</span>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
