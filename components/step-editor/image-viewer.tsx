"use client";

import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ImageViewerProps {
  src: string;
  alt: string;
}

export function ImageViewer({ src, alt }: ImageViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [showVideo, setShowVideo] = useState(false);
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (videoRef.current && showVideo) {
      videoRef.current.play();
    }
  }, [showVideo]);

  return (
    <div className={cn(
      "h-full flex flex-col image-viewer",
      isDark ? "bg-background" : "bg-white"
    )}>
      <div className="flex-1 relative overflow-hidden">
        {showVideo ? (
          <div className="absolute inset-0 scale-150">
            <video
              ref={videoRef}
              src="/videos/neurons_reverse_low.mov"
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
            />
          </div>
        ) : (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `scale(${zoom / 100})`, transition: 'transform 0.2s ease-out' }}
          >
            <img 
              src={src} 
              alt={alt}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>
      <div className={cn(
        "flex-none p-4 border-t",
        isDark ? "bg-background" : "bg-white"
      )}>
        <div className="flex items-center justify-between">
          <Switch
            checked={showVideo}
            onCheckedChange={setShowVideo}
          />
          {!showVideo && (
            <div className="flex items-center gap-4 flex-1 ml-4">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={50}
                max={200}
                step={1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}