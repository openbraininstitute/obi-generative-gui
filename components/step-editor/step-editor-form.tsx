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
import { FromIDSelector } from './fromid-selector';
import { ArtifactsView } from './artifacts-view';
import { LatexPreview } from './latex-preview';

// Panel size configurations
const PANEL_SIZES = {
  DESCRIPTION: {
    FILE_LIST: {
      DEFAULT: 20,
      MIN: 15,
      MAX: 25
    },
    EDITOR: {
      DEFAULT: 40,
      MIN: 30,
      MAX: 45
    },
    PREVIEW: {
      DEFAULT: 40,
      MIN: 30,
      MAX: 45
    }
  },
  TWO_PANEL: {
    EDITOR: {
      DEFAULT: 35,
      MIN: 20,
      MAX: 80
    },
    PREVIEW: {
      DEFAULT: 65,
      MIN: 20,
      MAX: 80
    }
  },
  THREE_PANEL: {
    BLOCK_LIST: {
      DEFAULT: 20,
      MIN: 20,
      MAX: 35
    },
    EDITOR: {
      DEFAULT: 30,
      MIN: 20,
      MAX: 55
    },
    PREVIEW: {
      DEFAULT: 50,
      MIN: 20,
      MAX: 45
    }
  }
};

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
  selectedMethod: string;                   // Selected HTTP method
  onSubmit: (data: any) => void;           // Callback for form submission
  selectedTab: string;                      // Current active tab
  description: string;                      // LaTeX description content
  onDescriptionChange: (value: string) => void;  // Handler for description updates
  selectedFile: string | null;              // Currently selected file
  files: Record<string, string>;            // Map of file names to contents
  onFileSelect: (file: string) => void;     // Handler for file selection
  onFileChange: (file: string, content: string) => void;  // Handler for file content changes
  activeComponent: string;                  // Currently active component
  isCNSMode: boolean;                       // Whether CNS mode is enabled
}

export function StepEditorForm({ 
  schema, 
  spec, 
  selectedMethod,
  onSubmit,
  selectedTab,
  description,
  onDescriptionChange,
  selectedFile,
  files,
  onFileSelect,
  onFileChange,
  activeComponent,
  isCNSMode
}: StepEditorFormProps) {
  // Form handling hooks from react-hook-form
  const { register, handleSubmit, setValue, watch, reset } = useForm();
  
  // State management for block selection and form data
  const [selectedBlockInfo, setSelectedBlockInfo] = useState<{ section: string; blockId: string; blockType: string } | null>({
    section: 'initialize',
    blockId: 'initialize',
    blockType: 'Initialize'
  });
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [arrayFields, setArrayFields] = useState<Record<string, number>>({});
  const [dialogSection, setDialogSection] = useState<string>("");
  const [addingBlockSection, setAddingBlockSection] = useState<string>("");
  const [blocks, setBlocks] = useState<Record<string, BlockData[]>>({});
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [hasSingleBlock, setHasSingleBlock] = useState(false);
  const [selectedFromIDField, setSelectedFromIDField] = useState<{ name: string; type: string } | null>(null);
  
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
    if (!selectedBlockInfo) return null;
    const { section, blockType } = selectedBlockInfo;
    
    let description = '';
    if (section === 'initialize') {
      const initSchema = resolveSchema(schema.properties?.initialize as OpenAPIV3.SchemaObject);
      description = initSchema.description || '';
      return { schema: initSchema, description };
    }

    const sectionSchema = resolveSchema(schema.properties?.[section] as OpenAPIV3.SchemaObject);
    
    // Handle root block parameters
    if (sectionSchema.anyOf) {
      const blockSchema = sectionSchema.anyOf.find(schema => {
        const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
        const matches = resolved.title === blockType || resolved.const === blockType;
        if (matches) {
          description = resolved.description || '';
        }
        return matches;
      });
      return {
        schema: blockSchema ? resolveSchema(blockSchema as OpenAPIV3.SchemaObject) : null,
        description
      };
    }

    // Handle dictionary blocks
    if (!sectionSchema.additionalProperties) return { schema: null, description: '' };
    const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                        [sectionSchema.additionalProperties];
    
    const blockSchema = blockSchemas.find(schema => {
      const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
      const matches = resolved.title === blockType || resolved.const === blockType;
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
    
    // Initialize blocks for the initialize section
    initialBlocks['initialize'] = [{ id: 'initialize', type: 'Initialize', displayName: 'Initialize' }];
    
    // Process other sections
    Object.entries(sections).forEach(([section, schema]) => {
      if (section === 'initialize') {
        return;
      }
      
      if (section === 'type') {
        return;
      }
      
      const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
      
      // Handle root block parameters (anyOf without additionalProperties)
      if (resolved.anyOf && !resolved.additionalProperties) {
        // Don't create an entry for root block parameters
        return;
      }
      
      // Handle dictionary blocks
      if (resolved.additionalProperties) {
        initialBlocks[section] = [];
      } else {
        initialBlocks[section] = [];
      }
    });
    
    setBlocks(initialBlocks);
  }, [schema]);

  // Determine if form has only a single block
  useEffect(() => {
    const hasOnlyInitialize = Object.entries(sections).every(([key, value]) => {
      if (key === 'type') return true;
      
      const sectionSchema = resolveSchema(value as OpenAPIV3.SchemaObject);
      
      // Check if it's a block dictionary
      if (sectionSchema.additionalProperties) return false;
      
      // Check if it's a root block parameter
      if (sectionSchema.anyOf) return false;
      
      return true;
    });
    setHasSingleBlock(hasOnlyInitialize);
    if (hasOnlyInitialize) {
      setSelectedBlockInfo({
        section: 'initialize',
        blockId: 'initialize',
        blockType: 'Initialize'
      });
      setIsAddingBlock(false);
    }
  }, [sections]);

  // Reset form when selection changes
  useEffect(() => {
    if (selectedBlockInfo) {
      const { section, blockId, blockType } = selectedBlockInfo;
      const blockKey = `${section}-${blockId}`;
      
      const savedData = formData[blockKey];
      if (savedData) {
        // Add the block ID to the form data for reference
        savedData._blockId = blockId;
        reset(savedData);
      } else {
        reset({ _blockId: blockId });
      }
      setIsAddingBlock(false);
    }
  }, [selectedBlockInfo]);

  // Process and submit form data
  const handleFormSubmit = (data: any) => {
    const processedData = Object.entries(data).reduce((acc, [key, value]) => {
      // Skip the internal block ID field
      if (key === '_blockId') return acc;

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

    onSubmit(processedData);
  };

  // Update form data state
  const handleFormDataUpdate = (newData: any) => {
    if (selectedBlockInfo) {
      const { section, blockId } = selectedBlockInfo;
      const blockKey = `${section}-${blockId}`;
      setFormData(prev => ({
        ...prev,
        [blockKey]: { ...prev[blockKey], ...newData }
      }));
    }
  };

  const getBlockTypes = (section: string) => {
    const sectionSchema = resolveSchema(schema.properties?.[section] as OpenAPIV3.SchemaObject);
    
    // Handle both dictionary blocks and root block parameters
    if (sectionSchema.additionalProperties) {
      const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                          [sectionSchema.additionalProperties];
      
      return blockSchemas.map(schema => {
        const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
        return {
          title: resolved.title || resolved.const || 'Unnamed Block',
          description: resolved.description || 'No description available'
        };
      });
    }

    // Handle root block parameters
    if (sectionSchema.anyOf) {
      return sectionSchema.anyOf.map(schema => {
        const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
        return {
          title: resolved.title || resolved.const || 'Unnamed Block',
          description: resolved.description || 'No description available'
        };
      });
    }

    return [];
  };

  const handleAddBlock = (blockType: BlockType) => {
    // For root block parameters, just set the selected block
    if (addingBlockSection === selectedBlockInfo?.section) {
      setSelectedBlockInfo({
        section: addingBlockSection,
        blockId: blockType.title,
        blockType: blockType.title
      });
      setIsAddingBlock(false);
      setDialogSection("");
      setAddingBlockSection("");
      return;
    }

    // For dictionary blocks, create a new named block
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
    
    setSelectedBlockInfo({
      section: addingBlockSection,
      blockId: newBlock.id,
      blockType: blockType.title
    });
    setIsAddingBlock(false);
    setDialogSection("");
    setAddingBlockSection("");
  };

  // Render the main panels of the editor
  const renderPanels = () => {
    if (selectedTab === "artifacts") {
      return [
        <ResizablePanel key="artifacts" defaultSize={100}>
          <ArtifactsView />
        </ResizablePanel>
      ];
    }

    if (selectedTab === "description") {
      return [
        // Left Panel (File List)
        <ResizablePanel
          key="left" 
          defaultSize={PANEL_SIZES.DESCRIPTION.FILE_LIST.DEFAULT}
          minSize={PANEL_SIZES.DESCRIPTION.FILE_LIST.MIN}
          maxSize={PANEL_SIZES.DESCRIPTION.FILE_LIST.MAX}
          collapsible={false}
        >
          {renderFileList()}
        </ResizablePanel>,
        <ResizableHandle key="handle-1" withHandle className="bg-border" />,
        // Center Panel (Editor)
        <ResizablePanel 
          key="center"
          defaultSize={PANEL_SIZES.DESCRIPTION.EDITOR.DEFAULT}
          minSize={PANEL_SIZES.DESCRIPTION.EDITOR.MIN}
          maxSize={PANEL_SIZES.DESCRIPTION.EDITOR.MAX}
          collapsible={false}
        >
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
        <ResizablePanel 
          key="right"
          defaultSize={PANEL_SIZES.DESCRIPTION.PREVIEW.DEFAULT}
          minSize={PANEL_SIZES.DESCRIPTION.PREVIEW.MIN}
          maxSize={PANEL_SIZES.DESCRIPTION.PREVIEW.MAX}
          collapsible={false}
        >
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
        <ResizablePanel 
          key="left"
          defaultSize={PANEL_SIZES.THREE_PANEL.BLOCK_LIST.DEFAULT}
          minSize={PANEL_SIZES.THREE_PANEL.BLOCK_LIST.MIN}
          maxSize={PANEL_SIZES.THREE_PANEL.BLOCK_LIST.MAX}
          collapsible={false}
        >
          <div className="h-full flex flex-col">
            <div className="h-full overflow-y-auto">
              <BlockList
                spec={spec}
                sections={sections}
                blocks={blocks}
                selectedBlockInfo={selectedBlockInfo}
                onBlockSelect={(section, blockId, blockType) => {
                  setSelectedBlockInfo({ section, blockId, blockType });
                  setIsAddingBlock(false);
                }}
                onAddBlock={(section) => {
                  setBlockTypes(getBlockTypes(section));
                  setAddingBlockSection(section);
                  setDialogSection(section);
                  setIsAddingBlock(true);
                  setSelectedBlockInfo(null);
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
                    [section]: prev[section]?.filter(block => block.id !== blockId) || [],
                  }));
                  const deletedBlock = blocks[section]?.find(block => block.id === blockId);
                  if (deletedBlock) {
                    const blockKey = `${section}-${deletedBlock.id}`;
                    setFormData(prev => {
                      const newFormData = { ...prev };
                      delete newFormData[blockKey];
                      return newFormData;
                    });
                  }
                  if (selectedBlockInfo?.section === section && selectedBlockInfo?.blockId === blockId) {
                    setSelectedBlockInfo({
                      section: 'initialize',
                      blockId: 'initialize',
                      blockType: 'Initialize'
                    });
                  }
                }}
                onGenerate={handleSubmit(handleFormSubmit)}
                showGenerateButton={!hasSingleBlock}
              />
            </div>
          </div>
        </ResizablePanel>
      ) : null,

      // Center Panel (Form or Editor)
      <ResizablePanel 
        key="center" 
        defaultSize={hasSingleBlock ? PANEL_SIZES.TWO_PANEL.EDITOR.DEFAULT : PANEL_SIZES.THREE_PANEL.EDITOR.DEFAULT}
        minSize={hasSingleBlock ? PANEL_SIZES.TWO_PANEL.EDITOR.MIN : PANEL_SIZES.THREE_PANEL.EDITOR.MIN}
        maxSize={hasSingleBlock ? PANEL_SIZES.TWO_PANEL.EDITOR.MAX : PANEL_SIZES.THREE_PANEL.EDITOR.MAX}
        collapsible={false}
      >
        {isAddingBlock ? (
          <BlockTypeSelector blockTypes={blockTypes} onSelect={handleAddBlock} />
        ) : selectedBlockInfo && (
          <div className="h-full flex flex-col">
            <div className="flex-none flex items-center px-6 py-4 border-b relative group">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild onClick={() => {
                    if (selectedBlockInfo?.section === selectedBlockInfo?.blockType) {
                      setBlockTypes(getBlockTypes(selectedBlockInfo.section));
                      setIsAddingBlock(true);
                    }
                  }}>
                    <div className="text-sm px-2 py-1 rounded-md border text-muted-foreground cursor-pointer">
                      {selectedBlockInfo?.section === selectedBlockInfo?.blockType ? "Select" : selectedBlockInfo?.blockType}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getBlockSchema()?.description || "No description available"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isAddingBlock ? (
                <BlockTypeSelector blockTypes={blockTypes} onSelect={handleAddBlock} />
              ) : (
                <form className="h-full flex flex-col">
                <div className="flex-1 divide-y">
                  {selectedBlockInfo && (() => {
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
                        onFromIDSelect={(name, type) => setSelectedFromIDField({ name, type })}
                      />
                    ));
                  })()}
                </div>
                {hasSingleBlock && (
                  <div className="flex-none p-4 border-t">
                    <Button 
                      onClick={handleSubmit(handleFormSubmit)}
                      className="block"
                      size="sm"
                    >
                      Generate
                    </Button>
                  </div>
                )}
              </form>
              )}
            </div>
          </div>
        )}
      </ResizablePanel>,

      // Right Panel (LaTeX Preview or Image Viewer)
      <ResizablePanel 
        key="right" 
        defaultSize={hasSingleBlock ? PANEL_SIZES.TWO_PANEL.PREVIEW.DEFAULT : PANEL_SIZES.THREE_PANEL.PREVIEW.DEFAULT}
        minSize={hasSingleBlock ? PANEL_SIZES.TWO_PANEL.PREVIEW.MIN : PANEL_SIZES.THREE_PANEL.PREVIEW.MIN}
        maxSize={hasSingleBlock ? PANEL_SIZES.TWO_PANEL.PREVIEW.MAX : PANEL_SIZES.THREE_PANEL.PREVIEW.MAX}
        collapsible={false}
      >
        <div className="h-full">
          {selectedFromIDField ? (
            <FromIDSelector
              type={selectedFromIDField.type}
              value={watch(selectedFromIDField.name)}
              onChange={(value) => {
                const name = selectedFromIDField.name;
                setValue(name, value);
                setFormData(prev => ({ ...prev, [name]: value }));
                setSelectedFromIDField(null);
              }}
            />
          ) : (
            <ImageViewer 
              src={`${process.env.NEXT_PUBLIC_BASE_PATH}/images/Microcircuits.png`}
              alt="Microcircuits visualization"
            />
          )}
        </div>
      </ResizablePanel>
    ];

    // Add handles between panels
    const panelsWithHandles = configPanels.reduce((acc, panel, index) => {
      if (!panel) return acc;
      return index === configPanels.length - 1 
        ? [...acc, panel]
        : [...acc, panel, <ResizableHandle key={`handle-${index}`} withHandle className="bg-border" />];
    }, [] as React.ReactNode[]);

    return panelsWithHandles.filter(Boolean);
  }

  return (
    <div className="h-full overflow-hidden">
      <ResizablePanelGroup
        key={`${selectedTab}-${hasSingleBlock ? 'single' : 'multi'}-layout`}
        autoSaveId={`step-editor-${selectedTab}`}
        direction="horizontal"
        className="h-full"
      >
        {renderPanels()?.filter(Boolean)}
      </ResizablePanelGroup>
    </div>
  );
}