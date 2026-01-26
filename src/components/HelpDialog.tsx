import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Command {
  phrase: string;
  description: string;
}

const commands: Command[] = [
  { phrase: "Hey Vision, describe", description: "Describe what's around you in detail" },
  { phrase: "Hey Vision, navigate to [place]", description: "Get directions to a specific location" },
  { phrase: "Hey Vision, read", description: "Read any visible text, signs, or labels" },
  { phrase: "Hey Vision, detect objects", description: "Identify all objects and their positions" },
  { phrase: "Hey Vision, where am I", description: "Identify your current location or room" },
  { phrase: "Hey Vision, obstacle", description: "Check for hazards and obstacles ahead" },
  { phrase: "Hey Vision, help", description: "List all available voice commands" },
  { phrase: "Hey Vision, stop", description: "Stop the current operation" },
];

interface HelpDialogProps {
  onSpeak?: (text: string) => void;
}

export function HelpDialog({ onSpeak }: HelpDialogProps) {
  const handleReadCommands = () => {
    const text = "Available voice commands: " + 
      commands.map(c => `${c.phrase}, ${c.description}`).join(". ");
    onSpeak?.(text);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Help and voice commands">
          <HelpCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-accessible-lg">Voice Commands</DialogTitle>
          <DialogDescription className="text-lg">
            Say any of these commands to interact with VisionAI
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {commands.map((cmd, index) => (
            <div key={index} className="p-3 bg-background rounded-lg">
              <p className="font-semibold text-primary text-lg">"{cmd.phrase}"</p>
              <p className="text-muted-foreground">{cmd.description}</p>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleReadCommands} 
          variant="outline" 
          size="lg" 
          className="mt-4 w-full"
        >
          Read commands aloud
        </Button>
      </DialogContent>
    </Dialog>
  );
}
