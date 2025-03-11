"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { ZoomIn, ZoomOut } from "lucide-react";

interface ImageViewerProps {
  src: string;
  alt: string;
}

export function ImageViewer({ src, alt }: ImageViewerProps) {
  const [zoom, setZoom] = useState(100);
  const { theme } = useTheme();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative overflow-hidden">
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
      </div>
      <div className={cn(
        "flex-none p-4 border-t",
        theme === 'dark' ? 'bg-black/50' : 'bg-white/50'
      )}>
        <div className="flex items-center gap-4">
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
      </div>
    </div>
  );
}