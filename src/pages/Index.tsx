import { useState, useCallback, useEffect } from "react";
import { StatusBar } from "@/components/StatusBar";
import { CameraView } from "@/components/CameraView";
import { VoiceListener } from "@/components/VoiceListener";
import { ResponseDisplay } from "@/components/ResponseDisplay";
import { QuickActions } from "@/components/QuickActions";
import { EmergencyButton } from "@/components/EmergencyButton";
import { HelpDialog } from "@/components/HelpDialog";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceCommands, VoiceCommand } from "@/hooks/useVoiceCommands";
import { useVisionAI, VisionMode } from "@/hooks/useVisionAI";
import { useCamera } from "@/hooks/useCamera";
import { Settings, Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const HELP_MESSAGE = `Here are the voice commands you can use:
Say "Hey Vision, describe" to hear what's around you.
Say "Hey Vision, navigate to" followed by a location for directions.
Say "Hey Vision, read" to read any visible text.
Say "Hey Vision, detect" to identify nearby objects.
Say "Hey Vision, where am I" to identify your location.
Say "Hey Vision, obstacle" to check for hazards ahead.
Say "Hey Vision, stop" to cancel the current action.`;

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMode, setActiveMode] = useState<VisionMode | undefined>();
  const [showCamera, setShowCamera] = useState(true);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const { analyzeImage, isAnalyzing } = useVisionAI();
  const { captureImage, videoRef, startCamera, stopCamera, isActive: cameraActive } = useCamera();

  // Add message to conversation
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  // Handle AI vision analysis
  const performAnalysis = useCallback(async (mode: VisionMode, query?: string) => {
    // Capture image from camera
    const image = captureImage();
    
    if (!image) {
      const errorMsg = "Could not capture image from camera. Please ensure the camera is active.";
      speak(errorMsg);
      addMessage('assistant', errorMsg);
      return;
    }

    setLastCapturedImage(image);
    setActiveMode(mode);

    // Add user message
    const userMsg = query 
      ? `Hey Vision, ${mode}${query ? ` - ${query}` : ''}`
      : `Hey Vision, ${mode}`;
    addMessage('user', userMsg);

    // Speak acknowledgment
    const acknowledgments: Record<VisionMode, string> = {
      describe: "Analyzing scene...",
      navigate: query ? `Finding directions to ${query}...` : "Analyzing navigation options...",
      read: "Reading visible text...",
      detect: "Detecting objects...",
      location: "Identifying location...",
      obstacle: "Checking for obstacles...",
      general: "Analyzing...",
    };
    speak(acknowledgments[mode] || "Analyzing...");

    // Perform AI analysis
    const result = await analyzeImage(image, mode, query);

    if (result) {
      addMessage('assistant', result);
      speak(result);
    } else {
      const errorMsg = "I'm sorry, I couldn't analyze the scene. Please try again.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    }

    setActiveMode(undefined);
  }, [captureImage, analyzeImage, speak, addMessage]);

  // Handle voice commands
  const handleCommand = useCallback((result: { command: VoiceCommand; query?: string; rawText: string }) => {
    console.log('Command received:', result);

    switch (result.command) {
      case 'describe':
        performAnalysis('describe');
        break;
      case 'navigate':
        performAnalysis('navigate', result.query);
        break;
      case 'read':
        performAnalysis('read');
        break;
      case 'detect':
        performAnalysis('detect');
        break;
      case 'location':
        performAnalysis('location');
        break;
      case 'obstacle':
        performAnalysis('obstacle');
        break;
      case 'help':
        addMessage('user', 'Hey Vision, help');
        addMessage('assistant', HELP_MESSAGE);
        speak(HELP_MESSAGE);
        break;
      case 'stop':
        stopSpeaking();
        addMessage('user', 'Hey Vision, stop');
        addMessage('assistant', "Stopped.");
        speak("Stopped.");
        break;
      case 'unknown':
        if (result.query) {
          // Treat as general question
          performAnalysis('general', result.query);
        }
        break;
    }
  }, [performAnalysis, speak, stopSpeaking, addMessage]);

  // Voice command hook
  const { isListening, startListening, stopListening, isSupported: voiceSupported } = useVoiceCommands({
    onCommand: handleCommand,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Voice Error",
        description: error,
      });
    },
    continuous: true,
  });

  // Handle quick action buttons
  const handleQuickAction = useCallback((action: string) => {
    if (action === 'emergency') {
      return; // Handled by EmergencyButton
    }

    if (!cameraActive) {
      speak("Camera is not active. Please enable the camera first.");
      toast({
        variant: "destructive",
        title: "Camera Required",
        description: "Please enable the camera to use this feature.",
      });
      return;
    }

    const modeMap: Record<string, VisionMode> = {
      describe: 'describe',
      navigate: 'navigate',
      read: 'read',
      detect: 'detect',
      location: 'location',
    };

    const mode = modeMap[action];
    if (mode) {
      performAnalysis(mode);
    }
  }, [cameraActive, performAnalysis, speak]);

  // Toggle voice listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Start camera on mount
  useEffect(() => {
    if (showCamera) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [showCamera, startCamera, stopCamera]);

  // Start listening automatically
  useEffect(() => {
    if (voiceSupported && !isListening) {
      // Auto-start listening after a brief delay
      const timer = setTimeout(() => {
        startListening();
        speak("VisionAI is ready. Say Hey Vision followed by a command.");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [voiceSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Status Bar */}
      <StatusBar />
      
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-accessible-lg text-primary">VisionAI</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label={showCamera ? "Hide camera" : "Show camera"}
            onClick={() => setShowCamera(!showCamera)}
          >
            {showCamera ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
          </Button>
          <HelpDialog onSpeak={speak} />
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Camera View - takes more space when active */}
      {showCamera && (
        <div className="h-48 md:h-64 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            aria-label="Camera feed for scene analysis"
          />
          {cameraActive && (
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
          )}
        </div>
      )}

      {/* Response Display */}
      <ResponseDisplay 
        messages={messages} 
        isProcessing={isAnalyzing} 
      />

      {/* Quick Actions */}
      <QuickActions 
        onAction={handleQuickAction}
        activeMode={activeMode}
      />

      {/* Main Controls */}
      <div className="p-6 bg-card border-t border-border space-y-4">
        {/* Voice Listener - centered and prominent */}
        <VoiceListener
          isListening={isListening}
          isProcessing={isAnalyzing}
          isSpeaking={isSpeaking}
          onToggle={toggleListening}
        />

        {/* Emergency Button */}
        <EmergencyButton />
      </div>
    </div>
  );
};

export default Index;
