"use client";

import { OpenAPIV3 } from "openapi-types";
import { Button } from "@/components/ui/button";
import { Edit2, PlusCircle, Check, X, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { resolveSchemaRef } from "@/lib/api-client";

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
  selectedSection: string | null;
  selectedBlock: string | null;
  onSectionSelect: (section: string, block: string) => void;
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
  selectedSection,
  selectedBlock,
  onSectionSelect,
  onAddBlock,
  onUpdateBlockName,
  onDeleteBlock,
  onGenerate,
  showGenerateButton
}: BlockListProps) {
  const [editingBlock, setEditingBlock] = useState<{ section: string; id: string } | null>(null);
  const [editedName, setEditedName] = useState("");

  const blockParameters = getBlockParameters.bind({ spec })(sections);

  const handleStartEdit = (e: React.MouseEvent, section: string, block: BlockData) => {
    e.stopPropagation();
    setEditingBlock({ section, id: block.id });
    setEditedName(block.displayName);
  };

  const handleSaveEdit = (e: React.MouseEvent, section: string, blockId: string) => {
    e.stopPropagation();
    onUpdateBlockName(section, blockId, editedName);
    setEditingBlock(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBlock(null);
  };

  const handleDelete = (e: React.MouseEvent, section: string, blockId: string) => {
    e.stopPropagation();
    onDeleteBlock(section, blockId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1 p-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-muted rounded-sm",
                    selectedSection === 'initialize'
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                  onClick={() => onSectionSelect('initialize', 'Initialize')}
                >
                  Initialize
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getSectionDescription('initialize', sections.initialize)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Block Parameters */}
          {blockParameters.map(({ name }) => (
            <div key={name} className="mt-4">
              <div className="flex items-center justify-between px-3 mb-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "text-sm font-medium text-muted-foreground cursor-pointer",
                          selectedSection === name ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {name.toLowerCase().replace(/_/g, ' ')}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getSectionDescription(name, sections[name])}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 flex-shrink-0"
                  onClick={() => onAddBlock(name)}
                >
                  <PlusCircle className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Dictionary Blocks */}
          {Object.entries(sections).map(([sectionName, schema]) => (
            sectionName !== 'initialize' && !isBlockParameter(spec, schema) && (
              <div key={sectionName} className="mt-4">
                <div className="flex items-center justify-between px-3 mb-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-sm font-medium text-muted-foreground cursor-pointer">
                          {sectionName.toLowerCase().replace(/_/g, ' ')}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getSectionDescription(sectionName, sections[sectionName])}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                  {(blocks[sectionName] || []).map((block) => (
                    <div key={block.id} className="group">
                      {editingBlock?.section === sectionName && editingBlock?.id === block.id ? (
                        <div className="flex items-center gap-1 px-3 py-1">
                          <input
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="h-6 text-sm flex-1 px-2 rounded border"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => handleSaveEdit(e, sectionName, block.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center min-w-0">
                          <button
                            className={cn(
                              "flex-1 min-w-0 text-left px-3 py-1.5 text-sm transition-colors hover:bg-muted rounded-sm",
                              selectedSection === sectionName && selectedBlock === block.type
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                            onClick={() => onSectionSelect(sectionName, block.type)}
                            title={block.displayName}
                          >
                            <span className="block truncate">
                              {block.displayName}
                            </span>
                          </button>
                          {selectedSection === sectionName && selectedBlock === block.type && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleStartEdit(e, sectionName, block)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={(e) => handleDelete(e, sectionName, block.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
      {showGenerateButton && (
        <div className="flex-none p-4 border-t">
          <Button 
            onClick={onGenerate}
            className="w-full"
            size="sm"
          >
            Generate
          </Button>
        </div>
      )}
    </div>
  );
}