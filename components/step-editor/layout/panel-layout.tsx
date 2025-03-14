"use client";

import { ReactNode, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from '@/lib/utils';

interface PanelLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  editorOnRight?: boolean;
}

export function PanelLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  editorOnRight
}: PanelLayoutProps) {
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  const panels = [
    <div key="left-container" className="relative">
      <ResizablePanel 
        key="left" 
        defaultSize={20} 
        minSize={15} 
        maxSize={30}
        className={cn(
          "transition-all duration-300 ease-in-out",
          isLeftPanelCollapsed ? "w-0" : "w-full"
        )}
      >
        <div className={cn(
          "absolute inset-0 transition-all duration-300",
          isLeftPanelCollapsed ? "opacity-0" : "opacity-100"
        )}>
          {leftPanel}
        </div>
      </ResizablePanel>
      <ChevronLeft 
        className={cn(
          "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 cursor-pointer text-white hover:text-white/80 transition-all duration-200",
          isLeftPanelCollapsed ? "-right-10 rotate-180" : "-right-3"
        )}
        onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
      />
    </div>,
    <ResizablePanel key="center" defaultSize={50} minSize={30} maxSize={60}>
      {editorOnRight ? rightPanel : centerPanel}
    </ResizablePanel>,
    <ResizablePanel key="right" defaultSize={30} minSize={20} maxSize={50}>
      {editorOnRight ? centerPanel : rightPanel}
    </ResizablePanel>
  ];

  const panelsWithHandles = panels.reduce((acc, panel, index) => {
    if (index === panels.length - 1) return [...acc, panel];
    return [...acc, panel, <ResizableHandle key={`handle-${index}`} withHandle />];
  }, [] as React.ReactNode[]);

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {panelsWithHandles}
      </ResizablePanelGroup>
    </div>
  );
}