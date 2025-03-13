"use client";

import { useForm } from "react-hook-form";
import { OpenAPIV3 } from "openapi-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resolveSchemaRef } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { BlockList } from "./block-list";
import { FormField } from "./form-field";
import { ImageViewer } from "./views/image-viewer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { nanoid } from 'nanoid';
import { useTheme } from 'next-themes';
import { FileText } from 'lucide-react';
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

interface StepEditorFormProps {
  schema: OpenAPIV3.SchemaObject;
  spec: OpenAPIV3.Document;
  onSubmit: (data: any) => void;
  editorOnRight: boolean;
  selectedTab: string;
  description: string;
  onDescriptionChange: (value: string) => void;
  selectedFile: string | null;
  files: Record<string, string>;
  onFileSelect: (file: string) => void;
  onFileChange: (file: string, content: string) => void;
}

interface BlockData {
  id: string;
  type: string;
  displayName: string;
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
  const { register, handleSubmit, setValue, watch, reset } = useForm();
  const [selectedSection, setSelectedSection] = useState<string | null>("initialize");
  const [selectedBlock, setSelectedBlock] = useState<string | null>("Initialize");
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [arrayFields, setArrayFields] = useState<Record<string, number>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogSection, setDialogSection] = useState<string>("");
  const [blocks, setBlocks] = useState<Record<string, BlockData[]>>({});
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const fileList = [
    'Method.tex',
    'Rational.tex',
    'ResultsSummary.tex'
  ];

  const renderFileList = () => (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="space-y-1 p-6 pt-12">
          <h3 className="text-sm font-medium text-muted-foreground px-3 mb-4">Files</h3>
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

  const resolveSchema = (schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined): OpenAPIV3.SchemaObject => {
    if (!schema) {
      return { type: 'object', properties: {} };
    }
    if ('$ref' in schema) {
      return resolveSchemaRef(spec, schema.$ref);
    }
    return schema;
  };

  const getBlockSchema = () => {
    if (!selectedSection || !selectedBlock) return null;
    
    if (selectedSection === 'initialize') {
      return resolveSchema(schema.properties?.initialize as OpenAPIV3.SchemaObject);
    }

    const sectionSchema = resolveSchema(schema.properties?.[selectedSection] as OpenAPIV3.SchemaObject);
    if (!sectionSchema.additionalProperties) return null;

    const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                        [sectionSchema.additionalProperties];
    
    const blockSchema = blockSchemas.find(schema => {
      const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
      return resolved.title === selectedBlock || resolved.const === selectedBlock;
    });

    return blockSchema ? resolveSchema(blockSchema as OpenAPIV3.SchemaObject) : null;
  };

  const sections = Object.entries(schema.properties || {}).reduce((acc, [key, value]) => {
    if (key === 'type') return acc;
    if (key === 'initialize') {
      acc = { initialize: value, ...acc };
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject>);

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

  const handleFormDataUpdate = (newData: any) => {
    if (selectedSection && selectedBlock) {
      const blockKey = `${selectedSection}-${selectedBlock}`;
      setFormData(prev => ({
        ...prev,
        [blockKey]: { ...prev[blockKey], ...newData }
      }));
    }
  };

  const renderPanels = () => {
    const panels = [
      // Left Panel (Block List or File List)
      <ResizablePanel key="left" defaultSize={20} minSize={15} maxSize={30}>
        {selectedTab === "description" ? renderFileList() : (
          <BlockList
            sections={sections}
            blocks={blocks}
            selectedSection={selectedSection}
            selectedBlock={selectedBlock}
            onSectionSelect={(section, block) => {
              setSelectedSection(section);
              setSelectedBlock(block);
            }}
            onAddBlock={(section) => {
              setDialogSection(section);
              setIsDialogOpen(true);
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
        )}
      </ResizablePanel>,

      // Center Panel (Form or Editor)
      <ResizablePanel key="center" defaultSize={50} minSize={30}>
        {selectedTab === "description" ? (
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
        ) : (
          <div className="h-full flex flex-col">
            {selectedSection && selectedBlock && (
              <>
                <div className="flex-none flex items-center px-6 py-4">
                  <div className="text-sm px-2 py-1 rounded-md border text-muted-foreground">
                    {selectedBlock}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <form>
                    <div className="divide-y">
                      {(() => {
                        const blockSchema = getBlockSchema();
                        if (!blockSchema?.properties) return null;
                        
                        return Object.entries(blockSchema.properties).map(([name, property]) => (
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
                  </form>
                </div>
              </>
            )}
          </div>
        )}
      </ResizablePanel>,

      // Right Panel (Image Viewer)
      <ResizablePanel key="right" defaultSize={30} minSize={20}>
        <div className="h-full">
          <ImageViewer 
            src="/images/Microcircuits.png"
            alt="Microcircuits visualization"
          />
        </div>
      </ResizablePanel>
    ];

    // Add handles between panels
    const panelsWithHandles = panels.reduce((acc, panel, index) => {
      if (index === panels.length - 1) return [...acc, panel];
      return [...acc, panel, <ResizableHandle key={`handle-${index}`} withHandle className="bg-border" />];
    }, [] as React.ReactNode[]);

    return panelsWithHandles;
  };

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {renderPanels()}
      </ResizablePanelGroup>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Block Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {(() => {
              if (!dialogSection) return null;
              const sectionSchema = resolveSchema(schema.properties?.[dialogSection] as OpenAPIV3.SchemaObject);
              if (!sectionSchema.additionalProperties) return null;

              const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                                [sectionSchema.additionalProperties];
              
              return blockSchemas.map(schema => {
                const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
                const blockType = resolved.title || resolved.const || 'Unnamed Block';
                return (
                  <Button
                    key={blockType}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      const nextIndex = blocks[dialogSection]?.filter(block => 
                        block.displayName.startsWith(blockType.toLowerCase())
                      ).length || 0;
                      
                      const newBlock = {
                        id: nanoid(),
                        type: blockType,
                        displayName: `${blockType.toLowerCase()}_${nextIndex}`
                      };
                      
                      setBlocks(prev => ({
                        ...prev,
                        [dialogSection]: [...(prev[dialogSection] || []), newBlock]
                      }));
                      
                      setSelectedSection(dialogSection);
                      setSelectedBlock(blockType);
                      setIsDialogOpen(false);
                    }}
                  >
                    {blockType}
                  </Button>
                );
              });
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}