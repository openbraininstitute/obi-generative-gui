"use client";

import { OpenAPIV3 } from "openapi-types"; 
import { ChevronRight, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { resolveSchemaRef } from "@/lib/api-client";
import { useState } from "react";

interface BlockData {
  id: string;
  type: string;
  displayName: string;
}

interface BlockParameter {
  name: string;
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
}

interface BlockListProps {
  spec: OpenAPIV3.Document;
  sections: Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>;
  blocks: Record<string, BlockData[]>;
  selectedBlockInfo: { section: string; blockId: string } | null;
  onBlockSelect: (section: string, blockId: string, blockType: string) => void;
  onAddBlock: (section: string) => void;
  onUpdateBlockName: (section: string, blockId: string, newName: string) => void;
  onDeleteBlock: (section: string, blockId: string) => void;
  onGenerate: () => void;
  showGenerateButton: boolean;
  onBlocksInit?: (section: string, blockTypes: BlockData[]) => void;
}

function resolveSchema(spec: OpenAPIV3.Document, schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined): OpenAPIV3.SchemaObject {
  if (!schema) {
    return { type: 'object', properties: {} };
  }
  if ('$ref' in schema) {
    return resolveSchemaRef(spec, schema.$ref);
  }
  return schema;
}

function getSectionDescription(section: string, schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): string {
  if ('$ref' in schema) return 'No description available';
  return schema.description || 'No description available';
}

function isBlockParameter(spec: OpenAPIV3.Document, schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): boolean {
  const resolved = resolveSchema(spec, schema);
  return resolved.anyOf !== undefined;
}

function getBlockParameters(sections: Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>): BlockParameter[] {
  return Object.entries(sections)
    .filter(([name, schema]) => name !== 'initialize' && name !== 'type')
    .map(([name, schema]) => ({ name, schema }))
    .filter(param => isBlockParameter(this.spec, param.schema));
}

export function BlockList({
  spec,
  sections,
  blocks,
  selectedBlockInfo,
  onBlockSelect,
  onAddBlock,
  onUpdateBlockName,
  onDeleteBlock,
  onGenerate,
  showGenerateButton
}: BlockListProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['initialize']));

  const blockParameters = getBlockParameters.bind({ spec })(sections);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-1">
          {/* Initialization Section */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mb-1">
                  <button
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm font-medium bg-gray-50 dark:bg-gray-900/50 rounded-sm transition-colors",
                      selectedBlockInfo?.section === 'initialize'
                        ? "text-primary"
                        : "text-foreground hover:bg-gray-100 dark:hover:bg-gray-900/80"
                    )}
                    onClick={() => onBlockSelect('initialize', 'Initialize', 'Initialize')}
                  >
                    Initialization
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getSectionDescription('initialize', sections.initialize)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Other Sections */}
          <div>
            {Object.entries(sections).map(([sectionName, schema]) => (
              sectionName !== 'initialize' && sectionName !== 'type' && (
              <div key={sectionName}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleSection(sectionName)}
                        className={cn(
                          "w-full flex items-center px-3 py-1.5 text-sm font-medium transition-colors",
                          expandedSections.has(sectionName) ? "bg-gray-50 dark:bg-gray-900/50" : "hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              !expandedSections.has(sectionName) && "-rotate-90"
                            )}
                          />
                          <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-1.5 rounded">
                            {blocks[sectionName]?.length || 0}
                          </span>
                          <span>{sectionName.charAt(0).toUpperCase() + sectionName.slice(1).toLowerCase().replace(/_/g, ' ')}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddBlock(sectionName);
                            }}
                            className={cn(
                              "h-6 w-6 flex items-center justify-center",
                              "text-muted-foreground hover:text-primary",
                              "transition-colors"
                            )}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getSectionDescription(sectionName, schema)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {expandedSections.has(sectionName) && (
                  <div className="pl-6 pr-2">
                    {blocks[sectionName]?.map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "w-full text-left px-3 py-1 text-sm transition-colors",
                          selectedBlockInfo?.section === sectionName && selectedBlockInfo?.blockId === block.id
                            ? "text-primary bg-gray-50 dark:bg-gray-900/50"
                            : "text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-900/50"
                        )}
                        onClick={() => onBlockSelect(sectionName, block.id, block.type)}
                      >
                        {block.displayName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )
            ))}
          </div>
        </div>
      </div>
      {showGenerateButton && (
        <div className="flex-none p-3 border-t">
          <Button 
            onClick={onGenerate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            Generate
          </Button>
        </div>
      )}
    </div>
  );
}