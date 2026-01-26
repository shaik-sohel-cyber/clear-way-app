import { useEffect } from "react";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/useCamera";
import { cn } from "@/lib/utils";

interface CameraViewProps {
  onCapture?: (imageData: string) => void;
  autoStart?: boolean;
  className?: string;
}

export function CameraView({ onCapture, autoStart = true, className }: CameraViewProps) {
  const { 
    isActive, 
    isSupported, 
    error, 
    videoRef, 
    startCamera, 
    stopCamera, 
    captureImage,
    switchCamera 
  } = useCamera({ facingMode: 'environment' });

  useEffect(() => {
    if (autoStart && isSupported) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart, isSupported, startCamera, stopCamera]);

  const handleCapture = () => {
    const image = captureImage();
    if (image && onCapture) {
      onCapture(image);
    }
  };

  if (!isSupported) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-card rounded-2xl p-6",
        className
      )}>
        <CameraOff className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground text-center">
          Camera is not supported on this device
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-card rounded-2xl p-6",
        className
      )}>
        <CameraOff className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive text-center mb-4">{error}</p>
        <Button onClick={startCamera} variant="outline" size="lg">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-black", className)}>
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        aria-label="Camera feed for scene analysis"
      />
      
      {/* Overlay with controls */}
      {isActive && (
        <>
          {/* Camera switch button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 rounded-full bg-background/80 backdrop-blur-sm"
            onClick={switchCamera}
            aria-label="Switch camera"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>

          {/* Capture button */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <Button
              variant="default"
              size="xl"
              className="rounded-full min-w-[5rem] min-h-[5rem] glow-primary"
              onClick={handleCapture}
              aria-label="Capture image for analysis"
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>

          {/* Status indicator */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-full">
            <span className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium">Live</span>
          </div>
        </>
      )}

      {/* Loading state */}
      {!isActive && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="flex flex-col items-center gap-4">
            <Camera className="h-12 w-12 text-primary animate-pulse" />
            <p className="text-lg">Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}
