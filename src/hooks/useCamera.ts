import { useState, useCallback, useRef, useEffect } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

interface UseCameraReturn {
  isActive: boolean;
  isSupported: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => string | null;
  switchCamera: () => Promise<void>;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode = 'environment', width = 1280, height = 720 } = options;
  
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const isSupported = typeof navigator !== 'undefined' && 
    'mediaDevices' in navigator && 
    'getUserMedia' in navigator.mediaDevices;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setError('Camera is not supported on this device');
      return;
    }

    try {
      setError(null);
      
      // Stop any existing stream
      stopCamera();
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setIsActive(true);
      
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            setError('Camera permission denied. Please enable camera access in your settings.');
            break;
          case 'NotFoundError':
            setError('No camera found on this device.');
            break;
          case 'NotReadableError':
            setError('Camera is in use by another application.');
            break;
          default:
            setError(`Camera error: ${err.message}`);
        }
      } else {
        setError('Failed to access camera.');
      }
    }
  }, [isSupported, currentFacingMode, width, height, stopCamera]);

  const switchCamera = useCallback(async () => {
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    setCurrentFacingMode(newFacingMode);
    
    if (isActive) {
      stopCamera();
      // Brief delay before restarting with new camera
      setTimeout(startCamera, 100);
    }
  }, [currentFacingMode, isActive, startCamera, stopCamera]);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !isActive) {
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }
      
      ctx.drawImage(video, 0, 0);
      
      // Return as base64 JPEG
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Haptic feedback for capture
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 50]);
      }
      
      return dataUrl;
      
    } catch (err) {
      console.error('Capture error:', err);
      return null;
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    isActive,
    isSupported,
    error,
    videoRef,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
  };
}
