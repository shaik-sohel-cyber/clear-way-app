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
  | 'yes'
  | 'no'
  | 'unknown';

interface CommandResult {
  command: VoiceCommand;
  query?: string;
  rawText: string;
}

interface UseVoiceCommandsOptions {
  onCommand?: (result: CommandResult) => void;
  onListening?: (isListening: boolean) => void;
  onError?: (error: string) => void;
  onTranscript?: (transcript: string) => void;
  continuous?: boolean;
}

interface UseVoiceCommandsReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  lastTranscript: string;
}

// Command patterns with flexible matching
const COMMAND_PATTERNS: Array<{ pattern: RegExp; command: VoiceCommand }> = [
  // Describe scene - with or without "Hey Vision"
  { pattern: /(?:hey\s+vision[\s,]+)?describe/i, command: 'describe' },
  { pattern: /(?:hey\s+vision[\s,]+)?what('s|s| is)\s+(around|ahead|in front)/i, command: 'describe' },
  { pattern: /(?:hey\s+vision[\s,]+)?scene/i, command: 'describe' },
  { pattern: /(?:hey\s+vision[\s,]+)?look/i, command: 'describe' },
  { pattern: /^(one|1|first|describe)$/i, command: 'describe' },
  
  // Navigation
  { pattern: /(?:hey\s+vision[\s,]+)?navigate/i, command: 'navigate' },
  { pattern: /(?:hey\s+vision[\s,]+)?guide/i, command: 'navigate' },
  { pattern: /(?:hey\s+vision[\s,]+)?direction/i, command: 'navigate' },
  { pattern: /(?:hey\s+vision[\s,]+)?where\s+(should|can|do)\s+i\s+(go|walk)/i, command: 'navigate' },
  { pattern: /(?:hey\s+vision[\s,]+)?take\s+me\s+to/i, command: 'navigate' },
  { pattern: /(?:hey\s+vision[\s,]+)?how\s+(do\s+i\s+)?get\s+to/i, command: 'navigate' },
  { pattern: /^(two|2|second|navigate)$/i, command: 'navigate' },
  
  // Read text
  { pattern: /(?:hey\s+vision[\s,]+)?read/i, command: 'read' },
  { pattern: /(?:hey\s+vision[\s,]+)?what\s+does\s+(it|this|that)\s+say/i, command: 'read' },
  { pattern: /(?:hey\s+vision[\s,]+)?text/i, command: 'read' },
  { pattern: /^(three|3|third|read)$/i, command: 'read' },
  
  // Detect objects
  { pattern: /(?:hey\s+vision[\s,]+)?detect/i, command: 'detect' },
  { pattern: /(?:hey\s+vision[\s,]+)?objects/i, command: 'detect' },
  { pattern: /(?:hey\s+vision[\s,]+)?what\s+(objects|things)/i, command: 'detect' },
  { pattern: /(?:hey\s+vision[\s,]+)?identify/i, command: 'detect' },
  { pattern: /^(four|4|fourth|detect)$/i, command: 'detect' },
  
  // Location
  { pattern: /(?:hey\s+vision[\s,]+)?location/i, command: 'location' },
  { pattern: /(?:hey\s+vision[\s,]+)?where\s+am\s+i/i, command: 'location' },
  { pattern: /(?:hey\s+vision[\s,]+)?what\s+(room|place|area)/i, command: 'location' },
  { pattern: /^(five|5|fifth|location)$/i, command: 'location' },
  
  // Obstacle warning
  { pattern: /(?:hey\s+vision[\s,]+)?obstacle/i, command: 'obstacle' },
  { pattern: /(?:hey\s+vision[\s,]+)?danger/i, command: 'obstacle' },
  { pattern: /(?:hey\s+vision[\s,]+)?hazard/i, command: 'obstacle' },
  { pattern: /(?:hey\s+vision[\s,]+)?warning/i, command: 'obstacle' },
  { pattern: /(?:hey\s+vision[\s,]+)?(is\s+it\s+)?safe/i, command: 'obstacle' },
  { pattern: /(?:hey\s+vision[\s,]+)?check\s+(path|way|ahead)/i, command: 'obstacle' },
  { pattern: /^(six|6|sixth|obstacle|check)$/i, command: 'obstacle' },
  
  // Help
  { pattern: /(?:hey\s+vision[\s,]+)?help/i, command: 'help' },
  { pattern: /(?:hey\s+vision[\s,]+)?commands/i, command: 'help' },
  { pattern: /(?:hey\s+vision[\s,]+)?what\s+can\s+you\s+do/i, command: 'help' },
  
  // Stop
  { pattern: /(?:hey\s+vision[\s,]+)?stop/i, command: 'stop' },
  { pattern: /(?:hey\s+vision[\s,]+)?quiet/i, command: 'stop' },
  { pattern: /(?:hey\s+vision[\s,]+)?cancel/i, command: 'stop' },
  
  // Yes/No for conversational flow
  { pattern: /^(yes|yeah|yep|sure|okay|ok)$/i, command: 'yes' },
  { pattern: /^(no|nope|nah)$/i, command: 'no' },
];

function parseCommand(text: string): CommandResult {
  const normalizedText = text.toLowerCase().trim();
  
  for (const { pattern, command } of COMMAND_PATTERNS) {
    if (pattern.test(normalizedText)) {
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
  
  // Check if it contains "Hey Vision" but command not recognized
  if (/hey\s+vision/i.test(normalizedText)) {
    const queryMatch = normalizedText.match(/hey\s+vision[\s,]+(.+)/i);
    return { 
      command: 'unknown', 
      query: queryMatch?.[1],
      rawText: text 
    };
  }
  
  return { command: 'unknown', query: normalizedText, rawText: text };
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}): UseVoiceCommandsReturn {
  const { onCommand, onListening, onError, onTranscript, continuous = true } = options;
  
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const isStoppingRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRestartingRef = useRef(false);
  
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Voice recognition is not supported in this browser.');
      return;
    }

    if (isRestartingRef.current) {
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }

    clearRestartTimeout();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      isRestartingRef.current = false;
      setIsListening(true);
      onListening?.(true);
      isStoppingRef.current = false;
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEventType) => {
      const results = event.results;
      
      for (let i = event.resultIndex; i < results.length; i++) {
        const result = results[i];
        if (result.isFinal) {
          const transcript = result[0].transcript.trim();
          setLastTranscript(transcript);
          onTranscript?.(transcript);
          
          const parsed = parseCommand(transcript);
          console.log('Voice command parsed:', parsed);
          
          onCommand?.(parsed);
          
          // Haptic feedback for recognized command
          if (parsed.command !== 'unknown' && 'vibrate' in navigator) {
            navigator.vibrate([50, 30, 50]);
          }
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventType) => {
      // Only log non-aborted, non-no-speech errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
        onError?.(`Voice recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      onListening?.(false);
      
      // Restart if continuous and not manually stopped
      if (continuous && !isStoppingRef.current) {
        isRestartingRef.current = true;
        clearRestartTimeout();
        
        restartTimeoutRef.current = setTimeout(() => {
          if (!isStoppingRef.current) {
            isRestartingRef.current = false;
            startListening();
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      isRestartingRef.current = false;
      // Try again after a delay
      restartTimeoutRef.current = setTimeout(() => {
        if (!isStoppingRef.current) {
          startListening();
        }
      }, 500);
    }
  }, [isSupported, continuous, onCommand, onListening, onError, onTranscript, clearRestartTimeout]);

  const stopListening = useCallback(() => {
    isStoppingRef.current = true;
    isRestartingRef.current = false;
    clearRestartTimeout();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    onListening?.(false);
  }, [onListening, clearRestartTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      clearRestartTimeout();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [clearRestartTimeout]);

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
