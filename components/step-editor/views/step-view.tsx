"use client";

import { ImageViewer } from "./image-viewer";
import { DescriptionEditor } from "./description-editor";
import { ResizablePanel } from "@/components/ui/resizable";

interface StepViewProps {
  selectedTab: string;
  description: string;
  onDescriptionChange: (value: string) => void;
}

export function StepView({ selectedTab, description, onDescriptionChange }: StepViewProps) {
  return (
    <ResizablePanel defaultSize={30} minSize={20}>
      <div className="h-full">
        {selectedTab === "description" ? (
          <DescriptionEditor 
            value={description}
            onChange={onDescriptionChange}
          />
        ) : (
          <ImageViewer 
            src="/images/Microcircuits.png"
            alt="Microcircuits visualization"
          />
        )}
      </div>
    </ResizablePanel>
  );
}