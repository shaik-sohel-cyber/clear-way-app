import { useState, useCallback, useRef } from 'react';
import { VoiceCommand } from './useVoiceCommands';
import { VisionMode } from './useVisionAI';

export type ConversationState = 
  | 'idle' 
  | 'greeting' 
  | 'waiting_for_choice' 
  | 'processing' 
  | 'confirming';

export interface AssistantMessage {
  text: string;
  expectingResponse: boolean;
  options?: Array<{
    id: VisionMode | 'help' | 'cancel';
    label: string;
    number: number;
  }>;
}

interface UseConversationalAssistantOptions {
  onAction: (mode: VisionMode, query?: string) => void;
  onSpeak: (text: string) => void;
  onHelp: () => void;
}

const MENU_OPTIONS = [
  { id: 'describe' as const, label: 'Describe the scene', number: 1 },
  { id: 'navigate' as const, label: 'Get navigation help', number: 2 },
  { id: 'read' as const, label: 'Read visible text', number: 3 },
  { id: 'detect' as const, label: 'Detect objects', number: 4 },
  { id: 'location' as const, label: 'Identify my location', number: 5 },
  { id: 'obstacle' as const, label: 'Check for obstacles', number: 6 },
];

const GREETING_MESSAGE = `Hello! I'm VisionAI, your visual assistant. How can I help you today? 
Say one of the following:
1. Describe the scene
2. Navigate
3. Read text
4. Detect objects
5. Find my location
6. Check for obstacles
Or just say what you need, like "Hey Vision, describe".`;

const MENU_MESSAGE = `What would you like me to do?
1. Describe the scene
2. Get navigation help
3. Read visible text
4. Detect objects
5. Identify location
6. Check for obstacles
Just say the number or the action.`;

export function useConversationalAssistant(options: UseConversationalAssistantOptions) {
  const { onAction, onSpeak, onHelp } = options;
  
  const [state, setState] = useState<ConversationState>('idle');
  const [pendingAction, setPendingAction] = useState<VisionMode | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const hasGreetedRef = useRef(false);

  const greet = useCallback(() => {
    if (!hasGreetedRef.current) {
      hasGreetedRef.current = true;
      setState('greeting');
      onSpeak(GREETING_MESSAGE);
      
      // After greeting, wait for choice
      setTimeout(() => {
        setState('waiting_for_choice');
      }, 500);
    }
  }, [onSpeak]);

  const showMenu = useCallback(() => {
    setState('waiting_for_choice');
    onSpeak(MENU_MESSAGE);
  }, [onSpeak]);

  const handleCommand = useCallback((result: { command: VoiceCommand; query?: string; rawText: string }): boolean => {
    lastInteractionRef.current = Date.now();
    
    const { command, query, rawText } = result;
    
    // Direct commands always work
    switch (command) {
      case 'describe':
        setState('processing');
        onAction('describe');
        return true;
        
      case 'navigate':
        setState('processing');
        onAction('navigate', query);
        return true;
        
      case 'read':
        setState('processing');
        onAction('read');
        return true;
        
      case 'detect':
        setState('processing');
        onAction('detect');
        return true;
        
      case 'location':
        setState('processing');
        onAction('location');
        return true;
        
      case 'obstacle':
        setState('processing');
        onAction('obstacle');
        return true;
        
      case 'help':
        onHelp();
        return true;
        
      case 'stop':
        setState('idle');
        setPendingAction(null);
        return true;
        
      case 'yes':
        if (pendingAction) {
          setState('processing');
          onAction(pendingAction);
          setPendingAction(null);
          return true;
        }
        break;
        
      case 'no':
        if (pendingAction) {
          setPendingAction(null);
          showMenu();
          return true;
        }
        break;
        
      case 'unknown':
        // If we're waiting for a choice, try to parse the raw text
        if (state === 'waiting_for_choice' && query) {
          // Try to match against a general question
          setState('processing');
          onAction('general', query);
          return true;
        }
        break;
    }
    
    return false;
  }, [state, pendingAction, onAction, onHelp, showMenu]);

  const onProcessingComplete = useCallback(() => {
    setState('idle');
    
    // After processing, prompt for next action after a delay
    setTimeout(() => {
      if (Date.now() - lastInteractionRef.current > 10000) {
        onSpeak("Is there anything else I can help you with? Just say a command or say help for options.");
      }
    }, 3000);
  }, [onSpeak]);

  const reset = useCallback(() => {
    setState('idle');
    setPendingAction(null);
  }, []);

  return {
    state,
    greet,
    showMenu,
    handleCommand,
    onProcessingComplete,
    reset,
    menuOptions: MENU_OPTIONS,
    greetingMessage: GREETING_MESSAGE,
    menuMessage: MENU_MESSAGE,
  };
}
