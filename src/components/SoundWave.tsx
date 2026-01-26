import { cn } from "@/lib/utils";

interface SoundWaveProps {
  isActive?: boolean;
  className?: string;
}

export function SoundWave({ isActive = true, className }: SoundWaveProps) {
  if (!isActive) return null;
  
  return (
    <div className={cn("sound-wave", className)} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
