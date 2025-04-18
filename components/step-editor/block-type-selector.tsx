"use client";

import { BlockType } from './types';

interface BlockTypeSelectorProps {
  blockTypes: BlockType[];
  onSelect: (blockType: BlockType) => void;
}

export function BlockTypeSelector({ blockTypes, onSelect }: BlockTypeSelectorProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6">
          <div className="space-y-4">
            {blockTypes.map((blockType, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left group"
                onClick={() => onSelect(blockType)}
              >
                <div className="flex-1">
                  <h3 className="font-medium group-hover:text-primary transition-colors">{blockType.title.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{blockType.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}