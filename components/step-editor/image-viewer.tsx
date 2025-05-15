"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface ImageViewerProps {
  src: string;
  alt: string;
}

export function ImageViewer({ src, alt }: ImageViewerProps) {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "h-full flex flex-col image-viewer",
      isDark ? "bg-background" : "bg-white"
    )}>
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-contain"
          controls
          autoPlay
          loop
          muted
        >
          <source src={`${process.env.NEXT_PUBLIC_BASE_PATH}/video/circuit_video.mp4`} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}