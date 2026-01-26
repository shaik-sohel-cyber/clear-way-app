import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBar } from "@/components/StatusBar";
import { VoiceListener } from "@/components/VoiceListener";
import { ResponseDisplay } from "@/components/ResponseDisplay";
import { QuickActions } from "@/components/QuickActions";
import { EmergencyButton } from "@/components/EmergencyButton";
import { HelpDialog } from "@/components/HelpDialog";
import { ObstacleWarningOverlay } from "@/components/ui/ObstacleWarningOverlay";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useVoiceCommands, VoiceCommand } from "@/hooks/useVoiceCommands";
import { useVisionAI, VisionMode } from "@/hooks/useVisionAI";
import { useCamera } from "@/hooks/useCamera";
import { useAutoObstacleDetection } from "@/hooks/useAutoObstacleDetection";
import { useSettings } from "@/contexts/SettingsContext";
import { Camera, CameraOff, WifiOff, Wifi } from "lucide-react";
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { settings } = useSettings();
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const { analyzeImage, isAnalyzing } = useVisionAI();
  const { captureImage, videoRef, startCamera, stopCamera, isActive: cameraActive } = useCamera();

  // Auto obstacle detection
  const { lastWarning, warningLevel, isChecking } = useAutoObstacleDetection({
    captureImage,
    isActive: cameraActive && showCamera,
  });

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: "Back Online", description: "Connection restored" });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast({ 
        variant: "destructive", 
        title: "Offline", 
        description: "Some features may be limited" 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
      const errorMsg = "Could not capture image from camera. Please ensure the camera is active.";
      speak(errorMsg);
      addMessage('assistant', errorMsg);
      return;
    }

    setActiveMode(mode);

    const userMsg = query 
      ? `Hey Vision, ${mode}${query ? ` - ${query}` : ''}`
      : `Hey Vision, ${mode}`;
    addMessage('user', userMsg);

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

    // Haptic feedback
    if (settings.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

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
  }, [captureImage, analyzeImage, speak, addMessage, settings.hapticFeedback]);

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
    if (action === 'emergency') return;

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
      const timer = setTimeout(() => {
        startListening();
        speak("VisionAI is ready. Say Hey Vision followed by a command.");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [voiceSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-screen bg-background pb-20">
      {/* Status Bar */}
      <StatusBar isOnline={isOnline} />
      
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50 backdrop-blur-lg"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 rounded-full bg-primary/20"
            animate={{ scale: isListening ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
          >
            {isOnline ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-warning" />
            )}
          </motion.div>
          <h1 className="text-accessible-lg text-primary font-bold">VisionAI</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label={showCamera ? "Hide camera" : "Show camera"}
            onClick={() => setShowCamera(!showCamera)}
            className="touch-target"
          >
            {showCamera ? <CameraOff className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
          </Button>
          <HelpDialog onSpeak={speak} />
        </div>
      </motion.header>

      {/* Camera View */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden"
          >
            <div className="h-56 md:h-72 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                aria-label="Camera feed for scene analysis"
              />
              
              {/* Camera overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none" />
              
              {/* Live indicator */}
              {cameraActive && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-3 left-3 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full"
                >
                  <motion.span 
                    className="w-2.5 h-2.5 rounded-full bg-success"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <span className="text-sm font-medium">Live</span>
                </motion.div>
              )}

              {/* Obstacle warning overlay */}
              <ObstacleWarningOverlay 
                warningLevel={warningLevel}
                message={lastWarning || undefined}
                isVisible={settings.autoObstacleWarning && warningLevel !== 'none'}
              />

              {/* Analyzing indicator */}
              {(isAnalyzing || isChecking) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-full"
                >
                  <span className="text-sm font-medium text-primary-foreground">
                    {isChecking ? 'Scanning...' : 'Analyzing...'}
                  </span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-card/50 backdrop-blur-lg border-t border-border space-y-4"
      >
        {/* Voice Listener */}
        <VoiceListener
          isListening={isListening}
          isProcessing={isAnalyzing}
          isSpeaking={isSpeaking}
          onToggle={toggleListening}
        />

        {/* Emergency Button */}
        <EmergencyButton />
      </motion.div>
    </div>
  );
};

export default Index;
