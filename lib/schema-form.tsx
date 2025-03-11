"use client";

import { useForm } from "react-hook-form";
import { OpenAPIV3 } from "openapi-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resolveSchemaRef } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { BlockList } from "@/lib/components/block-list";
import { FormField } from "@/lib/components/form-field";
import { ImageViewer } from "@/lib/components/image-viewer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { nanoid } from 'nanoid';

interface SchemaFormProps {
  schema: OpenAPIV3.SchemaObject;
  spec: OpenAPIV3.Document;
  onSubmit: (data: any) => void;
  editorOnRight: boolean;
}

interface BlockData {
  id: string;
  type: string;
  displayName: string;
}

export function SchemaForm({ schema, spec, onSubmit, editorOnRight }: SchemaFormProps) {
  const { register, handleSubmit, setValue, watch, reset } = useForm();
  const [selectedSection, setSelectedSection] = useState<string | null>("initialize");
  const [selectedBlock, setSelectedBlock] = useState<string | null>("Initialize");
  const [formData, setFormData] = useState<Record<string, Record<string, any>>>({});
  const [arrayFields, setArrayFields] = useState<Record<string, number>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogSection, setDialogSection] = useState<string>("");
  const [blocks, setBlocks] = useState<Record<string, BlockData[]>>({});

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

  const getAvailableBlocks = (section: string) => {
    if (section === 'initialize') {
      return ['Initialize'];
    }

    const sectionSchema = resolveSchema(schema.properties?.[section] as OpenAPIV3.SchemaObject);
    if (!sectionSchema.additionalProperties) return [];

    const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                        [sectionSchema.additionalProperties];
    
    return blockSchemas.map(schema => {
      const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
      return resolved.title || resolved.const || 'Unnamed Block';
    });
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

  const toSnakeCase = (str: string): string => {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  };

  const getNextBlockIndex = (section: string, blockType: string): number => {
    const sectionBlocks = blocks[section] || [];
    const typeBlocks = sectionBlocks.filter(block => 
      block.displayName.startsWith(toSnakeCase(blockType))
    );
    return typeBlocks.length;
  };

  const handleAddBlock = (section: string) => {
    setDialogSection(section);
    setIsDialogOpen(true);
  };

  const handleSelectBlock = (blockType: string) => {
    const nextIndex = getNextBlockIndex(dialogSection, blockType);
    const snakeCaseName = `${toSnakeCase(blockType)}_${nextIndex}`;
    
    const newBlock = {
      id: nanoid(),
      type: blockType,
      displayName: snakeCaseName
    };
    
    setBlocks(prev => ({
      ...prev,
      [dialogSection]: [...(prev[dialogSection] || []), newBlock]
    }));
    
    setSelectedSection(dialogSection);
    setSelectedBlock(blockType);
    setIsDialogOpen(false);
  };

  const handleUpdateBlockName = (section: string, blockId: string, newName: string) => {
    if (section === 'initialize') return;
    
    setBlocks(prev => ({
      ...prev,
      [section]: prev[section]?.map(block => 
        block.id === blockId 
          ? { ...block, displayName: newName }
          : block
      ) || []
    }));
  };

  const handleDeleteBlock = (section: string, blockId: string) => {
    if (section === 'initialize') return;

    setBlocks(prev => ({
      ...prev,
      [section]: prev[section]?.filter(block => block.id !== blockId) || []
    }));

    // Clear form data for the deleted block
    const deletedBlock = blocks[section]?.find(block => block.id === blockId);
    if (deletedBlock) {
      const blockKey = `${section}-${deletedBlock.type}`;
      setFormData(prev => {
        const newFormData = { ...prev };
        delete newFormData[blockKey];
        return newFormData;
      });
    }

    // Reset selection if the deleted block was selected
    if (selectedSection === section && blocks[section]?.find(block => block.id === blockId)?.type === selectedBlock) {
      setSelectedSection('initialize');
      setSelectedBlock('Initialize');
    }
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

  return (
    <>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-[calc(100vh-4rem)]"
      >
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <BlockList
            sections={sections}
            blocks={blocks}
            selectedSection={selectedSection}
            selectedBlock={selectedBlock}
            onSectionSelect={(section, block) => {
              setSelectedSection(section);
              setSelectedBlock(block);
            }}
            onAddBlock={handleAddBlock}
            onUpdateBlockName={handleUpdateBlockName}
            onDeleteBlock={handleDeleteBlock}
            onGenerate={handleSubmit(handleFormSubmit)}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-border" />
        
        {editorOnRight ? (
          <>
            <ResizablePanel defaultSize={50} minSize={30}>
              <ImageViewer 
                src="/images/Microcircuits.png"
                alt="Microcircuits visualization"
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-border" />
            
            <ResizablePanel defaultSize={30} minSize={20}>
              <div className="h-full overflow-y-auto">
                {selectedSection && selectedBlock && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center px-6 py-4">
                      <div className="text-sm px-2 py-1 rounded-md border text-muted-foreground">
                        {selectedBlock}
                      </div>
                    </div>
                    <form className="flex-1 overflow-y-auto">
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
                )}
              </div>
            </ResizablePanel>
          </>
        ) : (
          <>
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="h-full overflow-y-auto">
                {selectedSection && selectedBlock && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center px-6 py-4">
                      <div className="text-sm px-2 py-1 rounded-md border text-muted-foreground">
                        {selectedBlock}
                      </div>
                    </div>
                    <form className="flex-1 overflow-y-auto">
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
                )}
              </div>
            </ResizablePanel>
            
            <ResizableHandle withHandle className="bg-border" />
            
            <ResizablePanel defaultSize={30} minSize={20}>
              <ImageViewer 
                src="/images/Microcircuits.png"
                alt="Microcircuits visualization"
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {getAvailableBlocks(dialogSection).map((blockName) => (
              <Button
                key={blockName}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleSelectBlock(blockName)}
              >
                {blockName}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}