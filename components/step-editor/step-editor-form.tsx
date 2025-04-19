"use client";

import { useForm } from "react-hook-form";
import { OpenAPIV3 } from "openapi-types";
import { resolveSchemaRef } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { BlockList } from "./block-list";
import { FormField } from "./form-field";
import { ImageViewer } from "./image-viewer";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { nanoid } from 'nanoid';
import { useTheme } from 'next-themes';
import { FileText, Check } from 'lucide-react';
import { BlockType } from './types';
import { BlockTypeSelector } from './block-type-selector';
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { LatexPreview } from './latex-preview';

// Dynamically import the code editor to avoid SSR issues
const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

// Type definition for block data structure
interface BlockData {
  id: string;
  type: string;
  displayName: string;
}

// Props interface for the StepEditorForm component
interface StepEditorFormProps {
  schema: OpenAPIV3.SchemaObject;           // OpenAPI schema for form generation
  spec: OpenAPIV3.Document;                 // Complete OpenAPI specification
  onSubmit: (data: any) => void;           // Callback for form submission
  editorOnRight: boolean;                   // Layout control for editor position
  selectedTab: string;                      // Current active tab
  description: string;                      // LaTeX description content
  onDescriptionChange: (value: string) => void;  // Handler for description updates
  selectedFile: string | null;              // Currently selected file
  files: Record<string, string>;            // Map of file names to contents
  onFileSelect: (file: string) => void;     // Handler for file selection
  onFileChange: (file: string, content: string) => void;  // Handler for file content changes
}

export function StepEditorForm({ 
  schema, 
  spec, 
  onSubmit,
  editorOnRight,
  selectedTab,
  description,
  onDescriptionChange,
  selectedFile,
  files,
  onFileSelect,
  onFileChange
}: StepEditorFormProps) {
  // Form handling hooks from react-hook-form
  const { register, handleSubmit, setValue, watch, reset } = useForm();
  
  // State management for various form aspects
  const [selectedSection, setSelectedSection] = useState<string | null>("initialize");
  const [selectedBlock, setSelectedBlock] = useState<string | null>("Initialize");
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [arrayFields, setArrayFields] = useState<Record<string, number>>({});
  const [dialogSection, setDialogSection] = useState<string>("");
  const [addingBlockSection, setAddingBlockSection] = useState<string>("");
  const [blocks, setBlocks] = useState<Record<string, BlockData[]>>({});
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [hasSingleBlock, setHasSingleBlock] = useState(false);
  
  // Theme management
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // List of available LaTeX files
  const fileList = [
    'Method.tex',
    'Rational.tex',
    'ResultsSummary.tex'
  ];

  // Renders the file list sidebar
  const renderFileList = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1 p-4">
          {fileList.map((file) => (
            <button
              key={file}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-sm hover:bg-muted",
                selectedFile === file ? "text-primary bg-muted" : "text-muted-foreground"
              )}
              onClick={() => onFileSelect(file)}
            >
              <FileText className="h-4 w-4" />
              {file}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Helper function to resolve OpenAPI schema references
  const resolveSchema = (schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined): OpenAPIV3.SchemaObject => {
    if (!schema) {
      return { type: 'object', properties: {} };
    }
    if ('$ref' in schema) {
      return resolveSchemaRef(spec, schema.$ref);
    }
    return schema;
  };

  // Gets the schema for the currently selected block
  const getBlockSchema = () => {
    if (!selectedSection || !selectedBlock) return null;
    
    let description = '';
    if (selectedSection === 'initialize') {
      const initSchema = resolveSchema(schema.properties?.initialize as OpenAPIV3.SchemaObject);
      description = initSchema.description || '';
      return { schema: initSchema, description };
    }

    const sectionSchema = resolveSchema(schema.properties?.[selectedSection] as OpenAPIV3.SchemaObject);
    if (!sectionSchema.additionalProperties) return { schema: null, description: '' };

    const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                        [sectionSchema.additionalProperties];
    
    const blockSchema = blockSchemas.find(schema => {
      const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
      const matches = resolved.title === selectedBlock || resolved.const === selectedBlock;
      if (matches) {
        description = resolved.description || '';
      }
      return matches;
    });

    return {
      schema: blockSchema ? resolveSchema(blockSchema as OpenAPIV3.SchemaObject) : null,
      description
    };
  };

  // Extract sections from the schema, ensuring 'initialize' is first
  const sections = Object.entries(schema.properties || {}).reduce((acc, [key, value]) => {
    if (key === 'type') return acc;
    if (key === 'initialize') {
      acc = { initialize: value, ...acc };
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>);

  // Initialize blocks state when schema changes
  useEffect(() => {
    const initialBlocks: Record<string, BlockData[]> = {};
    Object.keys(sections).forEach(section => {
      if (section === 'initialize') {
        initialBlocks[section] = [{ id: 'initialize', type: 'Initialize', displayName: 'Initialize' }];
      } else {
        initialBlocks[section] = [];
      }
    });
    setBlocks(initialBlocks);
  }, [schema]);

  // Determine if form has only a single block
  useEffect(() => {
    const hasOnlyInitialize = Object.entries(sections).every(([key, value]) => {
      if (key === 'type' || key === 'initialize') return true;
      const sectionSchema = resolveSchema(value as OpenAPIV3.SchemaObject);
      return !sectionSchema.additionalProperties;
    });
    setHasSingleBlock(hasOnlyInitialize);
    if (hasOnlyInitialize) {
      setSelectedSection('initialize');
      setSelectedBlock('Initialize');
    }
  }, [sections]);

  // Reset form when selection changes
  useEffect(() => {
    if (selectedSection && selectedBlock) {
      const blockKey = `${selectedSection}-${selectedBlock}`;
      const savedData = formData[blockKey];
      if (savedData) {
        reset(savedData);
      } else {
        reset({});
      }
    }
  }, [selectedSection, selectedBlock]);

  // Process and submit form data
  const handleFormSubmit = (data: any) => {
    const processedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        const values = Object.entries(value)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([_, v]) => v);
        acc[key] = values;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);

    onSubmit({
      ...processedData,
      type: selectedBlock
    });
  };

  // Update form data state
  const handleFormDataUpdate = (newData: any) => {
    if (selectedSection && selectedBlock) {
      const blockKey = `${selectedSection}-${selectedBlock}`;
      setFormData(prev => ({
        ...prev,
        [blockKey]: { ...prev[blockKey], ...newData }
      }));
    }
  };

  const getBlockTypes = (section: string) => {
    const sectionSchema = resolveSchema(schema.properties?.[section] as OpenAPIV3.SchemaObject);
    if (!sectionSchema.additionalProperties) return [];

    const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                        [sectionSchema.additionalProperties];
    
    return blockSchemas.map(schema => {
      const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
      return {
        title: resolved.title || resolved.const || 'Unnamed Block',
        description: resolved.description || 'No description available'
      };
    });
  };

  const handleAddBlock = (blockType: BlockType) => {
    const nextIndex = blocks[dialogSection]?.filter(block => 
      block.displayName.startsWith(blockType.title.toLowerCase())
    ).length || 0;
    
    const newBlock = {
      id: nanoid(),
      type: blockType.title,
      displayName: `${blockType.title.toLowerCase()}_${nextIndex}`,
    };
    
    setBlocks(prev => ({
      ...prev,
      [addingBlockSection]: [...(prev[addingBlockSection] || []), newBlock]
    }));
    
    setSelectedSection(addingBlockSection);
    setSelectedBlock(blockType.title);
    setIsAddingBlock(false);
  };

  // Render the main panels of the editor
  const renderPanels = () => {
    if (selectedTab === "description") {
      return [
        // Left Panel (File List)
        <ResizablePanel key="left" defaultSize={23.5} minSize={23.5} maxSize={23.5}>
          {renderFileList()}
        </ResizablePanel>,
        <ResizableHandle key="handle-1" withHandle className="bg-border" />,
        // Center Panel (Editor)
        <ResizablePanel key="center" defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full p-4 bg-background">
            {selectedFile ? (
              <CodeEditor
                value={files[selectedFile] || ''}
                language="latex"
                placeholder="Enter LaTeX content..."
                onChange={(e) => onFileChange(selectedFile, e.target.value)}
                padding={15}
                style={{
                  fontSize: 14,
                  backgroundColor: "transparent",
                  fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                  height: '100%',
                  overflow: 'auto',
                  color: isDark ? '#ffffff' : '#000000'
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a file to edit
              </div>
            )}
          </div>
        </ResizablePanel>,
        <ResizableHandle key="handle-2" withHandle className="bg-border" />,
        // Right Panel (LaTeX Preview)
        <ResizablePanel key="right" defaultSize={46.5} minSize={30}>
          <div className="h-full">
            {selectedFile ? (
              <LatexPreview content={files[selectedFile] || ''} className="h-full" />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a file to preview
              </div>
            )}
          </div>
        </ResizablePanel>
      ];
    }

    const configPanels = [
      // Left Panel (Block List) - Only shown when there are multiple blocks
      !hasSingleBlock ? (
        <ResizablePanel key="left" defaultSize={23.5} minSize={20} maxSize={30}>
          <BlockList
            sections={sections}
            blocks={blocks}
            selectedSection={selectedSection}
            selectedBlock={selectedBlock}
            onSectionSelect={(section, block) => {
              setSelectedSection(section);
              setSelectedBlock(block);
              setIsAddingBlock(false);
            }}
            onAddBlock={(section) => {
              setAddingBlockSection(section);
              setBlockTypes(getBlockTypes(section));
              setSelectedSection(section);
              setIsAddingBlock(true);
            }}
            onUpdateBlockName={(section, blockId, newName) => {
              if (section === 'initialize') return;
              setBlocks(prev => ({
                ...prev,
                [section]: prev[section]?.map(block => 
                  block.id === blockId 
                    ? { ...block, displayName: newName }
                    : block
                ) || []
              }));
            }}
            onDeleteBlock={(section, blockId) => {
              if (section === 'initialize') return;
              setBlocks(prev => ({
                ...prev,
                [section]: prev[section]?.filter(block => block.id !== blockId) || []
              }));
              const deletedBlock = blocks[section]?.find(block => block.id === blockId);
              if (deletedBlock) {
                const blockKey = `${section}-${deletedBlock.type}`;
                setFormData(prev => {
                  const newFormData = { ...prev };
                  delete newFormData[blockKey];
                  return newFormData;
                });
              }
              if (selectedSection === section && blocks[section]?.find(block => block.id === blockId)?.type === selectedBlock) {
                setSelectedSection('initialize');
                setSelectedBlock('Initialize');
              }
            }}
            onGenerate={handleSubmit(handleFormSubmit)}
          />
        </ResizablePanel>
      ) : null,

      // Center Panel (Form or Editor)
      <ResizablePanel 
        key="center" 
        defaultSize={hasSingleBlock ? 40 : 30} 
        minSize={20} 
        maxSize={50}
      >
        {isAddingBlock ? (
          <BlockTypeSelector blockTypes={blockTypes} onSelect={handleAddBlock} />
        ) : selectedSection && selectedBlock && (
          <div className="h-full flex flex-col">
            <div className="flex-none flex items-center px-6 py-4 relative group">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-sm px-2 py-1 rounded-md border text-muted-foreground cursor-help">
                      {selectedBlock}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getBlockSchema()?.description || "No description available"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex-1 overflow-y-auto">
              <form>
                <div className="divide-y">
                  {(() => {
                    const blockSchema = getBlockSchema();
                    if (!blockSchema?.schema?.properties) return null;
                    
                    return Object.entries(blockSchema.schema.properties).map(([name, property]) => (
                      <FormField
                        key={name}
                        name={name}
                        property={property as OpenAPIV3.SchemaObject}
                        register={register}
                        setValue={setValue}
                        watch={watch}
                        resolveSchema={resolveSchema}
                        arrayFields={arrayFields}
                        setArrayFields={setArrayFields}
                        setFormData={handleFormDataUpdate}
                        blocks={blocks}
                      />
                    ));
                  })()}
                </div>
                {hasSingleBlock && (
                  <div className="p-4 border-t">
                    <Button 
                      onClick={handleSubmit(handleFormSubmit)}
                      className="w-full"
                      size="sm"
                    >
                      Generate
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </ResizablePanel>,

      // Right Panel (LaTeX Preview or Image Viewer)
      <ResizablePanel 
        key="right" 
        defaultSize={hasSingleBlock ? 60 : 46.5} 
        minSize={20}
      >
        <div className="h-full">
          <ImageViewer 
            src="/images/Microcircuits.png"
            alt="Microcircuits visualization"
          />
        </div>
      </ResizablePanel>
    ];

    // Add handles between panels
    const panelsWithHandles = configPanels.reduce((acc, panel, index) => {
      if (!panel) return acc;
      if (index === configPanels.length - 1) return [...acc, panel];
      const nextPanel = configPanels.slice(index + 1).find(Boolean);
      return nextPanel 
        ? [...acc, panel, <ResizableHandle key={`handle-${index}`} withHandle className="bg-border" />]
        : [...acc, panel];
    }, [] as React.ReactNode[]);

    // Reorder panels based on editorOnRight setting
    if (editorOnRight) {
      if (hasSingleBlock) {
        const [center, handle, right] = panelsWithHandles.filter(Boolean);
        return right ? [right, handle, center] : [center];
      } else {
        const [left, leftHandle, center, rightHandle, right] = panelsWithHandles;
        return [left, leftHandle, right, rightHandle, center];
      }
    }

    return hasSingleBlock
      ? panelsWithHandles.filter(Boolean)
      : panelsWithHandles;
  }

  return (
    <div className="h-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {renderPanels()?.filter(Boolean)}
      </ResizablePanelGroup>
    </div>
  );
}