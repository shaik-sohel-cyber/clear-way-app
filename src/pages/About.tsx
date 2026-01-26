import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Eye, 
  Navigation, 
  FileText, 
  Camera, 
  MapPin, 
  AlertTriangle,
  Mic,
  Heart
} from "lucide-react";

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

const features = [
  { icon: Eye, label: "Describe Scene", description: "Get detailed descriptions of your surroundings" },
  { icon: Navigation, label: "Navigate", description: "Get directions to specific locations" },
  { icon: FileText, label: "Read Text", description: "Read signs, labels, and printed text" },
  { icon: Camera, label: "Detect Objects", description: "Identify objects around you" },
  { icon: MapPin, label: "Location", description: "Know where you are" },
  { icon: AlertTriangle, label: "Obstacle Warnings", description: "Get alerted about hazards" },
];

export default function About() {
  const navigate = useNavigate();

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
          <h1 className="text-accessible-lg text-primary">About VisionAI</h1>
        </div>
      </header>

      <motion.main 
        className="p-4 space-y-6 pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero */}
        <motion.div variants={itemVariants} className="text-center py-8">
          <motion.div 
            className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Eye className="h-16 w-16 text-primary" />
          </motion.div>
          <h2 className="text-3xl font-bold text-foreground mb-2">VisionAI Assistant</h2>
          <p className="text-xl text-muted-foreground">Your AI-powered vision companion</p>
        </motion.div>

        {/* Description */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardContent className="p-6">
              <p className="text-lg leading-relaxed text-foreground">
                VisionAI is designed to help visually impaired users navigate the world with confidence. 
                Using advanced AI technology, it can describe scenes, read text, detect objects, and warn 
                about obstacles in real-time.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* How to Use */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Mic className="h-5 w-5 text-primary" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base text-muted-foreground">
                Simply say <span className="text-primary font-semibold">"Hey Vision"</span> followed by a command:
              </p>
              <ul className="space-y-2 text-lg">
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  "Hey Vision, describe" - Describe the scene
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  "Hey Vision, navigate to [place]" - Get directions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  "Hey Vision, read" - Read visible text
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  "Hey Vision, detect" - Detect objects
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  "Hey Vision, where am I" - Identify location
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">•</span>
                  "Hey Vision, obstacle" - Check for hazards
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={itemVariants}>
          <h3 className="text-xl font-semibold mb-4">Features</h3>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <Card key={feature.label} className="bg-card/50 backdrop-blur-sm border-border">
                <CardContent className="p-4 text-center">
                  <feature.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-sm">{feature.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Credits */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-destructive mx-auto mb-3" />
              <p className="text-lg">
                Built with love to make the world more accessible
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Powered by advanced AI vision technology
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.main>
    </div>
  );
}
