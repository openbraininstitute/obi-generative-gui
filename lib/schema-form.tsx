"use client";

import { useForm } from "react-hook-form";
import { OpenAPIV3 } from "openapi-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogSection, setDialogSection] = useState<string>("");
  const [blocks, setBlocks] = useState<Record<string, BlockData[]>>({});
  const [editedName, setEditedName] = useState("");

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

  const handleUpdateBlockName = () => {
    if (!selectedSection || !selectedBlock || selectedSection === 'initialize') return;
    
    setBlocks(prev => ({
      ...prev,
      [selectedSection]: prev[selectedSection]?.map(block => 
        block.type === selectedBlock 
          ? { ...block, displayName: editedName }
          : block
      ) || []
    }));
    
    setIsEditDialogOpen(false);
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
        onEditBlock={(displayName) => {
          setEditedName(displayName);
          setIsEditDialogOpen(true);
        }}
      />

      <div className="flex-1 overflow-y-auto">
        {selectedSection && selectedBlock && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{selectedBlock}</h2>
            </div>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 overflow-y-auto">
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
              <div className="sticky bottom-0 p-4 bg-background border-t">
                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Block Name</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="Enter block name"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBlockName}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}