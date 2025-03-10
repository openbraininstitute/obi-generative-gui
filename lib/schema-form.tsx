"use client";

import { useForm } from "react-hook-form";
import { OpenAPIV3 } from "openapi-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resolveSchemaRef } from "@/lib/api-client";
import { useState, useEffect } from "react";
import { BlockList } from "@/lib/components/block-list";
import { FormField } from "@/lib/components/form-field";

interface SchemaFormProps {
  schema: OpenAPIV3.SchemaObject;
  spec: OpenAPIV3.Document;
  onSubmit: (data: any) => void;
}

interface BlockData {
  type: string;
  displayName: string;
}

export function SchemaForm({ schema, spec, onSubmit }: SchemaFormProps) {
  const { register, handleSubmit, setValue, watch } = useForm();
  const [selectedSection, setSelectedSection] = useState<string | null>("initialize");
  const [selectedBlock, setSelectedBlock] = useState<string | null>("Initialize");
  const [formData, setFormData] = useState<any>({});
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

  // Initialize blocks state with available blocks from schema
  useEffect(() => {
    const initialBlocks: Record<string, BlockData[]> = {};
    Object.keys(sections).forEach(section => {
      if (section === 'initialize') {
        initialBlocks[section] = [{ type: 'Initialize', displayName: 'Initialize' }];
      } else {
        initialBlocks[section] = [];
      }
    });
    setBlocks(initialBlocks);
  }, [schema]);

  // Watch for form changes and submit automatically
  useEffect(() => {
    const subscription = watch((data) => {
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
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedBlock, onSubmit]);

  const handleAddBlock = (section: string) => {
    setDialogSection(section);
    setIsDialogOpen(true);
  };

  const handleSelectBlock = (blockType: string) => {
    const newBlock = {
      type: blockType,
      displayName: blockType
    };
    
    setBlocks(prev => ({
      ...prev,
      [dialogSection]: [...(prev[dialogSection] || []), newBlock]
    }));
    
    setSelectedSection(dialogSection);
    setSelectedBlock(blockType);
    setIsDialogOpen(false);
  };

  const handleUpdateBlockName = (section: string, blockType: string, newName: string) => {
    if (section === 'initialize') return;
    
    setBlocks(prev => ({
      ...prev,
      [section]: prev[section]?.map(block => 
        block.type === blockType 
          ? { ...block, displayName: newName }
          : block
      ) || []
    }));
  };

  return (
    <div className="flex flex-grow">
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
      />

      <div className="flex-1 overflow-y-auto">
        {selectedSection && selectedBlock && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{selectedBlock}</h2>
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
                      setFormData={setFormData}
                    />
                  ));
                })()}
              </div>
            </form>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select {dialogSection.slice(0, -1)} Type</DialogTitle>
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
    </div>
  );
}