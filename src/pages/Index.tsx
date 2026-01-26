import { useState, useCallback } from "react";
import { StatusBar } from "@/components/StatusBar";
import { VoiceButton } from "@/components/VoiceButton";
import { ResponseDisplay } from "@/components/ResponseDisplay";
import { QuickActions } from "@/components/QuickActions";
import { EmergencyButton } from "@/components/EmergencyButton";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Simulated AI responses for demo
const getAIResponse = (input: string, mode?: string): string => {
  const lowerInput = input.toLowerCase();
  
  if (mode === 'describe' || lowerInput.includes('describe') || lowerInput.includes('see') || lowerInput.includes('what')) {
    return "I can see a well-lit indoor space. There's a table about 3 feet ahead with what appears to be a coffee mug on it. The room has good natural lighting from a window to your left. The path ahead is clear for approximately 10 feet.";
  }
  
  if (mode === 'navigate' || lowerInput.includes('navigate') || lowerInput.includes('where') || lowerInput.includes('direction')) {
    return "You're facing north. The exit is approximately 20 feet ahead and slightly to your right. There's a clear path. Would you like turn-by-turn guidance?";
  }
  
  if (mode === 'read' || lowerInput.includes('read') || lowerInput.includes('text')) {
    return "I can see text ahead. It says: 'Welcome to the Main Lobby. Elevators are located to your right. Restrooms are down the hall on your left.' Would you like me to read anything else?";
  }
  
  if (mode === 'detect' || lowerInput.includes('detect') || lowerInput.includes('object')) {
    return "I've detected the following objects: A wooden chair 2 feet to your left. A potted plant at 4 o'clock, about 5 feet away. A person walking toward you from about 15 feet ahead. A door handle at arm's reach on your right.";
  }
  
  if (mode === 'location') {
    return "Based on available information, you appear to be in an indoor commercial building, likely a lobby or reception area. The architecture suggests a modern office building. Would you like me to describe the immediate surroundings in more detail?";
  }
  
  if (lowerInput.includes('help')) {
    return "I can help you in several ways: Say 'describe' to hear what's around you. Say 'navigate' for direction help. Say 'read' to have text read aloud. Say 'detect objects' to know what's nearby. Or just ask me anything!";
  }
  
  return "I'm here to help you navigate and understand your surroundings. You can ask me to describe what's ahead, read any text, detect objects, or provide navigation assistance. What would you like to know?";
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeMode, setActiveMode] = useState<string | undefined>();
  const { speak, isSpeaking } = useSpeechSynthesis();

  const handleSpeechResult = useCallback((text: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const response = getAIResponse(text, activeMode);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
      
      // Speak the response
      speak(response);
    }, 1500);
  }, [activeMode, speak]);

  const handleQuickAction = useCallback((action: string) => {
    if (action === 'emergency') {
      // Emergency is handled by the EmergencyButton component
      return;
    }
    
    setActiveMode(action);
    
    // Provide audio feedback
    const actionLabels: Record<string, string> = {
      describe: "Describe Scene mode activated. I'll describe what's around you.",
      navigate: "Navigation mode activated. I'll help guide you.",
      read: "Read Text mode activated. Point your camera at any text.",
      detect: "Object Detection mode activated. I'll identify nearby objects.",
      location: "Location mode activated. Let me determine where you are.",
    };
    
    const feedback = actionLabels[action] || "Mode activated";
    speak(feedback);
    
    // Simulate getting info for the mode
    handleSpeechResult(`Activate ${action} mode`);
  }, [speak, handleSpeechResult]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Status Bar */}
      <StatusBar />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-accessible-lg text-primary">VisionAI</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Help">
            <HelpCircle className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Response Display */}
      <ResponseDisplay 
        messages={messages} 
        isProcessing={isProcessing} 
      />

      {/* Quick Actions */}
      <QuickActions 
        onAction={handleQuickAction}
        activeMode={activeMode}
      />

      {/* Main Controls */}
      <div className="p-6 bg-card border-t border-border space-y-4">
        {/* Voice Button - centered and prominent */}
        <div className="flex justify-center">
          <VoiceButton 
            onSpeechResult={handleSpeechResult}
            isProcessing={isProcessing || isSpeaking}
          />
        </div>
        
        {/* Helper text */}
        <p className="text-center text-muted-foreground text-lg">
          {isProcessing ? "Processing..." : isSpeaking ? "Speaking..." : "Tap to speak"}
        </p>

        {/* Emergency Button */}
        <EmergencyButton />
      </div>
    </div>
  );
};

export default Index;
