import { cn } from "@/lib/utils";
import { SoundWave } from "./SoundWave";
import { Bot, User } from "lucide-react";

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

export function ResponseDisplay({ messages, isProcessing = false, className }: ResponseDisplayProps) {
  const lastMessage = messages[messages.length - 1];

  return (
    <div 
      className={cn(
        "flex-1 p-6 overflow-y-auto space-y-4",
        className
      )}
      role="log"
      aria-label="Conversation history"
      aria-live="polite"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
          <div className="p-6 rounded-full bg-primary/10 float">
            <Bot className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2 max-w-xs">
            <h2 className="text-accessible-lg">Hello! I'm your Vision Assistant</h2>
            <p className="text-muted-foreground text-lg">
              Tap the microphone button and ask me to describe what's around you, read text, or help you navigate.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-slide-up",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 p-2 rounded-full bg-primary/20">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[85%] p-4 rounded-2xl",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-br-md" 
                  : "bg-card border border-border rounded-bl-md"
              )}>
                <p className="text-lg leading-relaxed">{message.content}</p>
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 p-2 rounded-full bg-secondary">
                  <User className="h-6 w-6 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex gap-3 animate-fade-in">
              <div className="flex-shrink-0 p-2 rounded-full bg-primary/20">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md p-4 flex items-center gap-3">
                <SoundWave isActive />
                <span className="text-lg text-muted-foreground">Analyzing...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
