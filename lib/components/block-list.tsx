"use client";

import { OpenAPIV3 } from "openapi-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockData {
  type: string;
  displayName: string;
}

interface BlockListProps {
  sections: Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>;
  blocks: Record<string, BlockData[]>;
  selectedSection: string | null;
  selectedBlock: string | null;
  onSectionSelect: (section: string, block: string) => void;
  onAddBlock: (section: string) => void;
  onEditBlock: (displayName: string) => void;
}

export function BlockList({
  sections,
  blocks,
  selectedSection,
  selectedBlock,
  onSectionSelect,
  onAddBlock,
  onEditBlock,
}: BlockListProps) {
  return (
    <div className="w-[240px] border-r overflow-y-auto overflow-x-hidden">
      <div className="space-y-1 p-6">
        <button
          className={cn(
            "w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-muted text-ellipsis overflow-hidden whitespace-nowrap",
            selectedSection === 'initialize'
              ? "text-primary"
              : "text-muted-foreground"
          )}
          onClick={() => onSectionSelect('initialize', 'Initialize')}
        >
          Initialize
        </button>
        {Object.entries(sections).map(([sectionName]) => (
          sectionName !== 'initialize' && (
            <div key={sectionName} className="mt-4">
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-sm font-medium text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap pr-2">
                  {sectionName.toUpperCase().replace(/_/g, ' ')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 flex-shrink-0"
                  onClick={() => onAddBlock(sectionName)}
                >
                  <PlusCircle className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1 pl-4">
                {(blocks[sectionName] || []).map(({ type, displayName }) => (
                  <div key={type} className="group relative">
                    <button
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-muted rounded-sm text-ellipsis overflow-hidden whitespace-nowrap",
                        selectedSection === sectionName && selectedBlock === type
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                      onClick={() => onSectionSelect(sectionName, type)}
                      title={displayName}
                    >
                      {displayName}
                    </button>
                    {selectedSection === sectionName && selectedBlock === type && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBlock(displayName);
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}