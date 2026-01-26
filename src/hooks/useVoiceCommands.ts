import { useState, useCallback, useRef, useEffect } from 'react';

export type VoiceCommand = 
  | 'describe' 
  | 'navigate' 
  | 'read' 
  | 'detect' 
  | 'location' 
  | 'obstacle'
  | 'help'
  | 'stop'
  | 'unknown';

interface CommandResult {
  command: VoiceCommand;
  query?: string; // Additional context from the command
  rawText: string;
}

interface UseVoiceCommandsOptions {
  onCommand?: (result: CommandResult) => void;
  onListening?: (isListening: boolean) => void;
  onError?: (error: string) => void;
  continuous?: boolean;
}

interface UseVoiceCommandsReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  lastTranscript: string;
}

// Command patterns with "Hey Vision" wake word
const COMMAND_PATTERNS: Array<{ pattern: RegExp; command: VoiceCommand }> = [
  // Describe scene
  { pattern: /hey\s+vision[\s,]+describe/i, command: 'describe' },
  { pattern: /hey\s+vision[\s,]+what('s|s| is)\s+(around|ahead|in front)/i, command: 'describe' },
  { pattern: /hey\s+vision[\s,]+scene/i, command: 'describe' },
  { pattern: /hey\s+vision[\s,]+look/i, command: 'describe' },
  
  // Navigation
  { pattern: /hey\s+vision[\s,]+navigate/i, command: 'navigate' },
  { pattern: /hey\s+vision[\s,]+guide/i, command: 'navigate' },
  { pattern: /hey\s+vision[\s,]+direction/i, command: 'navigate' },
  { pattern: /hey\s+vision[\s,]+where\s+(should|can|do)\s+i\s+(go|walk)/i, command: 'navigate' },
  { pattern: /hey\s+vision[\s,]+take\s+me\s+to/i, command: 'navigate' },
  { pattern: /hey\s+vision[\s,]+how\s+(do\s+i\s+)?get\s+to/i, command: 'navigate' },
  
  // Read text
  { pattern: /hey\s+vision[\s,]+read/i, command: 'read' },
  { pattern: /hey\s+vision[\s,]+what\s+does\s+(it|this|that)\s+say/i, command: 'read' },
  { pattern: /hey\s+vision[\s,]+text/i, command: 'read' },
  
  // Detect objects
  { pattern: /hey\s+vision[\s,]+detect/i, command: 'detect' },
  { pattern: /hey\s+vision[\s,]+objects/i, command: 'detect' },
  { pattern: /hey\s+vision[\s,]+what\s+(objects|things)/i, command: 'detect' },
  { pattern: /hey\s+vision[\s,]+identify/i, command: 'detect' },
  
  // Location
  { pattern: /hey\s+vision[\s,]+location/i, command: 'location' },
  { pattern: /hey\s+vision[\s,]+where\s+am\s+i/i, command: 'location' },
  { pattern: /hey\s+vision[\s,]+what\s+(room|place|area)/i, command: 'location' },
  
  // Obstacle warning
  { pattern: /hey\s+vision[\s,]+obstacle/i, command: 'obstacle' },
  { pattern: /hey\s+vision[\s,]+danger/i, command: 'obstacle' },
  { pattern: /hey\s+vision[\s,]+hazard/i, command: 'obstacle' },
  { pattern: /hey\s+vision[\s,]+warning/i, command: 'obstacle' },
  { pattern: /hey\s+vision[\s,]+(is\s+it\s+)?safe/i, command: 'obstacle' },
  { pattern: /hey\s+vision[\s,]+check\s+(path|way|ahead)/i, command: 'obstacle' },
  
  // Help
  { pattern: /hey\s+vision[\s,]+help/i, command: 'help' },
  { pattern: /hey\s+vision[\s,]+commands/i, command: 'help' },
  { pattern: /hey\s+vision[\s,]+what\s+can\s+you\s+do/i, command: 'help' },
  
  // Stop
  { pattern: /hey\s+vision[\s,]+stop/i, command: 'stop' },
  { pattern: /hey\s+vision[\s,]+quiet/i, command: 'stop' },
  { pattern: /hey\s+vision[\s,]+cancel/i, command: 'stop' },
];

function parseCommand(text: string): CommandResult {
  const normalizedText = text.toLowerCase().trim();
  
  for (const { pattern, command } of COMMAND_PATTERNS) {
    if (pattern.test(normalizedText)) {
      // Extract any additional query after the command
      let query: string | undefined;
      
      // For navigation, extract destination
      if (command === 'navigate') {
        const navMatch = normalizedText.match(/(?:navigate|guide|take\s+me|get)\s+to\s+(.+)/i);
        if (navMatch) {
          query = navMatch[1];
        }
      }
      
      return { command, query, rawText: text };
    }
  }
  
  // Check if it starts with "Hey Vision" but command not recognized
  if (/hey\s+vision/i.test(normalizedText)) {
    // Extract everything after "Hey Vision" as a general query
    const queryMatch = normalizedText.match(/hey\s+vision[\s,]+(.+)/i);
    return { 
      command: 'unknown', 
      query: queryMatch?.[1],
      rawText: text 
    };
  }
  
  return { command: 'unknown', rawText: text };
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}): UseVoiceCommandsReturn {
  const { onCommand, onListening, onError, continuous = true } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const isStoppingRef = useRef(false);
  
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Voice recognition is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      onListening?.(true);
      isStoppingRef.current = false;
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEventType) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        const transcript = last[0].transcript;
        setLastTranscript(transcript);
        
        const result = parseCommand(transcript);
        console.log('Voice command parsed:', result);
        
        if (result.command !== 'unknown' || result.query) {
          onCommand?.(result);
          
          // Haptic feedback for recognized command
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
          }
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onError?.(`Voice recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      onListening?.(false);
      
      // Restart if continuous and not manually stopped
      if (continuous && !isStoppingRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (!isStoppingRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.log('Could not restart recognition:', e);
            }
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      onError?.('Failed to start voice recognition');
    }
  }, [isSupported, continuous, onCommand, onListening, onError]);

  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    onListening?.(false);
  }, [onListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    lastTranscript,
  };
}

// Type declarations for Web Speech API
type SpeechRecognitionEventType = {
  results: SpeechRecognitionResultListType;
  resultIndex: number;
} & Event;

type SpeechRecognitionErrorEventType = {
  error: string;
  message: string;
} & Event;

type SpeechRecognitionResultListType = {
  length: number;
  item(index: number): SpeechRecognitionResultType;
  [index: number]: SpeechRecognitionResultType;
};

type SpeechRecognitionResultType = {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternativeType;
  [index: number]: SpeechRecognitionAlternativeType;
};

type SpeechRecognitionAlternativeType = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEventType) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventType) => void) | null;
  onend: ((ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
} & EventTarget;

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType;
    webkitSpeechRecognition: new () => SpeechRecognitionType;
  }
}
