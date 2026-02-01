import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoiceListener } from "@/components/VoiceListener";
import { ResponseDisplay } from "@/components/ResponseDisplay";
import { EmergencyButton } from "@/components/EmergencyButton";
import { HelpDialog } from "@/components/HelpDialog";
import { ObstacleWarningOverlay } from "@/components/ui/ObstacleWarningOverlay";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceCommands, VoiceCommand } from "@/hooks/useVoiceCommands";
import { useVisionAI, VisionMode } from "@/hooks/useVisionAI";
import { useCamera } from "@/hooks/useCamera";
import { useAutoObstacleDetection } from "@/hooks/useAutoObstacleDetection";
import { useConversationalAssistant } from "@/hooks/useConversationalAssistant";
import { useSettings } from "@/contexts/SettingsContext";
import { Eye, Navigation, FileText, Search, MapPin, Shield, Settings, Volume2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const HELP_MESSAGE = `Voice Commands:
• "Describe" - scene overview
• "Navigate" - directions  
• "Read" - text reading
• "Detect" - find objects
• "Location" - where am I
• "Obstacle" - path check
• "Stop" - cancel`;

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeMode, setActiveMode] = useState<VisionMode | undefined>();
  const hasStartedRef = useRef(false);

  const { settings } = useSettings();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const { analyzeImage, isAnalyzing } = useVisionAI();
  const { captureImage, videoRef, startCamera, stopCamera, isActive: cameraActive } = useCamera();

  // Auto obstacle detection
  const { lastWarning, warningLevel, isChecking } = useAutoObstacleDetection({
    captureImage,
    isActive: cameraActive,
  });

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
    const image = captureImage();
    
    if (!image) {
      const errorMsg = "Camera not ready. Please wait.";
      speak(errorMsg);
      addMessage('assistant', errorMsg);
      return;
    }

    setActiveMode(mode);

    addMessage('user', mode);

    // Short acknowledgment
    const ack: Record<VisionMode, string> = {
      describe: "Looking...",
      navigate: "Checking path...",
      read: "Reading...",
      detect: "Scanning...",
      location: "Locating...",
      obstacle: "Checking ahead...",
      general: "Analyzing...",
    };
    speak(ack[mode] || "Analyzing...");

    // Haptic feedback
    if (settings.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    const result = await analyzeImage(image, mode, query);

    if (result) {
      addMessage('assistant', result);
      await speak(result);
    } else {
      const errorMsg = "Try again.";
      addMessage('assistant', errorMsg);
      speak(errorMsg);
    }

    setActiveMode(undefined);
  }, [captureImage, analyzeImage, speak, addMessage, settings.hapticFeedback]);

  // Show help
  const showHelp = useCallback(() => {
    addMessage('assistant', HELP_MESSAGE);
    speak(HELP_MESSAGE);
  }, [addMessage, speak]);

  // Conversational assistant
  const assistant = useConversationalAssistant({
    onAction: performAnalysis,
    onSpeak: speak,
    onHelp: showHelp,
  });

  // Handle voice commands
  const handleCommand = useCallback((result: { command: VoiceCommand; query?: string; rawText: string }) => {
    const handled = assistant.handleCommand(result);
    
    if (!handled && result.command === 'stop') {
      stopSpeaking();
      addMessage('assistant', "Stopped.");
    }
  }, [assistant, stopSpeaking, addMessage]);

  // Voice command hook
  const { isListening, startListening, stopListening, isSupported: voiceSupported } = useVoiceCommands({
    onCommand: handleCommand,
    onError: () => {},
    onTranscript: () => {},
    continuous: true,
  });

  // Store pending action when camera needs to start first
  const pendingActionRef = useRef<string | null>(null);

  // Handle quick action buttons
  const handleQuickAction = useCallback((action: string) => {
    if (!cameraActive) {
      // Store the action and start camera - action will execute when camera is ready
      pendingActionRef.current = action;
      speak("Starting camera...");
      startCamera();
      return;
    }

    const modeMap: Record<string, VisionMode> = {
      describe: 'describe',
      navigate: 'navigate',
      read: 'read',
      detect: 'detect',
      location: 'location',
      obstacle: 'obstacle',
    };

    const mode = modeMap[action];
    if (mode) {
      performAnalysis(mode);
    }
  }, [cameraActive, performAnalysis, speak, startCamera]);

  // Execute pending action when camera becomes active
  useEffect(() => {
    if (cameraActive && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      
      // Small delay to ensure camera is fully ready
      setTimeout(() => {
        const modeMap: Record<string, VisionMode> = {
          describe: 'describe',
          navigate: 'navigate',
          read: 'read',
          detect: 'detect',
          location: 'location',
          obstacle: 'obstacle',
        };
        const mode = modeMap[action];
        if (mode) {
          performAnalysis(mode);
        }
      }, 500);
    }
  }, [cameraActive, performAnalysis]);

  // Toggle voice listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup camera on unmount only
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Initial greeting after camera starts
  useEffect(() => {
    if (cameraActive && voiceSupported && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startListening();
      speak("VisionAI ready. Say a command or tap a button.");
    }
  }, [cameraActive, voiceSupported, startListening, speak]);

  const quickActions = [
    { id: 'describe', icon: Eye, label: 'Describe' },
    { id: 'navigate', icon: Navigation, label: 'Navigate' },
    { id: 'read', icon: FileText, label: 'Read' },
    { id: 'detect', icon: Search, label: 'Detect' },
    { id: 'location', icon: MapPin, label: 'Location' },
    { id: 'obstacle', icon: Shield, label: 'Obstacle' },
  ];

  // Handle start button - MUST be direct user gesture for mobile
  const handleStartApp = useCallback(async () => {
    await startCamera();
  }, [startCamera]);

  // Show start screen if camera not active
  if (!cameraActive) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">VisionAI Assistant</h1>
          <p className="text-muted-foreground">Tap below to start camera and voice assistant</p>
          <Button
            size="lg"
            className="min-h-[4rem] min-w-[12rem] text-lg rounded-full"
            onClick={handleStartApp}
          >
            <Camera className="mr-2 h-6 w-6" />
            Start Camera
          </Button>
          <p className="text-sm text-muted-foreground">Camera access required for vision features</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Camera - Full Screen Background */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          aria-label="Camera feed"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
      </div>

      {/* Obstacle Warning */}
      <ObstacleWarningOverlay 
        warningLevel={warningLevel}
        message={lastWarning || undefined}
        isVisible={settings.autoObstacleWarning && warningLevel !== 'none'}
      />

      {/* Top Bar */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-3 h-3 rounded-full bg-success"
            animate={{ opacity: cameraActive ? [1, 0.5, 1] : 0.3 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <span className="text-lg font-bold text-foreground">VisionAI</span>
        </div>
        <div className="flex items-center gap-2">
          <HelpDialog onSpeak={speak} />
          <Link to="/settings">
            <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Status Indicator */}
      <AnimatePresence>
        {(isAnalyzing || isChecking || isSpeaking) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 mx-4 mb-2"
          >
            <div className="flex items-center justify-center gap-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2">
              {isSpeaking && <Volume2 className="h-4 w-4 text-primary animate-pulse" />}
              <span className="text-sm font-medium">
                {isAnalyzing ? 'Analyzing...' : isChecking ? 'Scanning...' : 'Speaking...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 relative z-10 overflow-hidden">
        {messages.length > 0 ? (
          <ResponseDisplay messages={messages} isProcessing={isAnalyzing} />
        ) : (
          <div className="h-full flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-2"
            >
              <p className="text-xl font-medium text-foreground">Ready to help</p>
              <p className="text-muted-foreground">Say "Hey Vision" or tap below</p>
            </motion.div>
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="relative z-10 px-4 pb-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isActive = activeMode === action.id;
            return (
              <motion.button
                key={action.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAction(action.id)}
                disabled={isAnalyzing}
                className={`
                  flex flex-col items-center justify-center gap-1 p-3 rounded-xl
                  transition-all touch-target
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card/80 backdrop-blur-sm text-foreground hover:bg-card'
                  }
                  disabled:opacity-50
                `}
                aria-label={action.label}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium">{action.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Voice Control */}
        <VoiceListener
          isListening={isListening}
          isProcessing={isAnalyzing}
          isSpeaking={isSpeaking}
          onToggle={toggleListening}
        />

        {/* Emergency */}
        <div className="mt-3">
          <EmergencyButton />
        </div>
      </div>
    </div>
  );
};

export default Index;
