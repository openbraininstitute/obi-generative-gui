"use client";

import { BlockType } from './types';
import { Check } from 'lucide-react';

interface BlockTypeSelectorProps {
  blockTypes: BlockType[];
  onSelect: (blockType: BlockType) => void;
}

export function BlockTypeSelector({ blockTypes, onSelect }: BlockTypeSelectorProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overscroll-contain px-6">
        <div className="divide-y">
          {blockTypes.map((blockType, index) => (
            <button
              key={index}
              className="flex items-start gap-4 py-4 w-full hover:bg-muted/50 transition-colors text-left group"
              onClick={() => onSelect(blockType)}
            >
              <div className="flex-1">
                <h3 className="font-medium">
                  {blockType.title.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {blockType.description}
                </p>
              </div>
              <div className="flex-none">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}