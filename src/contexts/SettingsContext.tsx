import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  // Voice settings
  voiceSpeed: number;
  voicePitch: number;
  voiceVolume: number;
  
  // Obstacle detection
  autoObstacleWarning: boolean;
  obstacleWarningInterval: number; // seconds
  
  // Haptic feedback
  hapticFeedback: boolean;
  
  // UI preferences
  highContrastMode: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  
  // Privacy
  saveHistory: boolean;
  
  // Wake word
  wakeWord: string;
}

const defaultSettings: Settings = {
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  voiceVolume: 1.0,
  autoObstacleWarning: false,
  obstacleWarningInterval: 10,
  hapticFeedback: true,
  highContrastMode: true,
  fontSize: 'large',
  saveHistory: false,
  wakeWord: 'Hey Vision',
};

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const STORAGE_KEY = 'visionai-settings';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
