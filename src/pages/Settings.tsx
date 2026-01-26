import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Volume2, 
  Bell, 
  Vibrate, 
  Eye, 
  Shield, 
  RotateCcw,
  Mic,
  Gauge,
  Clock,
  Type,
  History
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettings();
  const [testSpeech, setTestSpeech] = useState(false);

  const handleVoiceTest = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Testing voice settings. This is how I will sound.");
      utterance.rate = settings.voiceSpeed;
      utterance.pitch = settings.voicePitch;
      utterance.volume = settings.voiceVolume;
      window.speechSynthesis.speak(utterance);
      setTestSpeech(true);
      setTimeout(() => setTestSpeech(false), 3000);
    }
  };

  const handleReset = () => {
    resetSettings();
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="touch-target"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-accessible-lg text-primary">Settings</h1>
        </div>
      </header>

      <motion.main 
        className="p-4 space-y-4 pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Voice Settings */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Volume2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Voice Settings</CardTitle>
                  <CardDescription>Customize how I speak to you</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Speaking Speed
                  </Label>
                  <span className="text-muted-foreground">{settings.voiceSpeed.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[settings.voiceSpeed]}
                  onValueChange={([value]) => updateSettings({ voiceSpeed: value })}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="touch-target"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Voice Pitch
                  </Label>
                  <span className="text-muted-foreground">{settings.voicePitch.toFixed(1)}</span>
                </div>
                <Slider
                  value={[settings.voicePitch]}
                  onValueChange={([value]) => updateSettings({ voicePitch: value })}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="touch-target"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Volume
                  </Label>
                  <span className="text-muted-foreground">{Math.round(settings.voiceVolume * 100)}%</span>
                </div>
                <Slider
                  value={[settings.voiceVolume]}
                  onValueChange={([value]) => updateSettings({ voiceVolume: value })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="touch-target"
                />
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleVoiceTest}
                disabled={testSpeech}
              >
                {testSpeech ? "Playing..." : "Test Voice"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Obstacle Detection */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-warning/20">
                  <Bell className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-xl">Obstacle Warnings</CardTitle>
                  <CardDescription>Automatic hazard detection</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Auto Obstacle Detection
                </Label>
                <Switch
                  checked={settings.autoObstacleWarning}
                  onCheckedChange={(checked) => updateSettings({ autoObstacleWarning: checked })}
                />
              </div>

              {settings.autoObstacleWarning && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <Label className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Check Interval
                    </Label>
                    <span className="text-muted-foreground">{settings.obstacleWarningInterval}s</span>
                  </div>
                  <Slider
                    value={[settings.obstacleWarningInterval]}
                    onValueChange={([value]) => updateSettings({ obstacleWarningInterval: value })}
                    min={5}
                    max={30}
                    step={5}
                    className="touch-target"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center gap-2">
                  <Vibrate className="h-4 w-4" />
                  Haptic Feedback
                </Label>
                <Switch
                  checked={settings.hapticFeedback}
                  onCheckedChange={(checked) => updateSettings({ hapticFeedback: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accessibility */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-accent/20">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-xl">Accessibility</CardTitle>
                  <CardDescription>Visual and interface options</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-base">High Contrast Mode</Label>
                <Switch
                  checked={settings.highContrastMode}
                  onCheckedChange={(checked) => updateSettings({ highContrastMode: checked })}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Font Size
                </Label>
                <Select
                  value={settings.fontSize}
                  onValueChange={(value: 'normal' | 'large' | 'extra-large') => 
                    updateSettings({ fontSize: value })
                  }
                >
                  <SelectTrigger className="touch-target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="extra-large">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Privacy */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary">
                  <History className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl">Privacy</CardTitle>
                  <CardDescription>Data and history preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Save Conversation History</Label>
                  <p className="text-sm text-muted-foreground">Keep history between sessions</p>
                </div>
                <Switch
                  checked={settings.saveHistory}
                  onCheckedChange={(checked) => updateSettings({ saveHistory: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reset */}
        <motion.div variants={itemVariants}>
          <Button 
            variant="outline" 
            className="w-full touch-target text-destructive hover:text-destructive-foreground hover:bg-destructive"
            onClick={handleReset}
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset All Settings
          </Button>
        </motion.div>
      </motion.main>
    </div>
  );
}
