"use client";

import { useForm } from "react-hook-form";
import { OpenAPIV3 } from "openapi-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { resolveSchemaRef } from "@/lib/api-client";
import { PlusCircle, X, Edit2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

  const isArrayType = (property: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): boolean => {
    const resolvedProperty = resolveSchema(property);
    if ('anyOf' in resolvedProperty) {
      return resolvedProperty.anyOf?.some(schema => 
        resolveSchema(schema as OpenAPIV3.SchemaObject).type === 'array'
      ) || false;
    }
    return resolvedProperty.type === 'array';
  };

  const getPropertyType = (property: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): string => {
    const resolvedProperty = resolveSchema(property);
    if ('anyOf' in resolvedProperty) {
      const types = resolvedProperty.anyOf?.map(schema => 
        resolveSchema(schema as OpenAPIV3.SchemaObject).type
      );
      return types?.find(type => type !== 'array') || 'string';
    }
    if (resolvedProperty.type === 'array') {
      const itemSchema = resolveSchema(resolvedProperty.items as OpenAPIV3.SchemaObject);
      return itemSchema.type || 'string';
    }
    return resolvedProperty.type || 'string';
  };

  const renderArrayField = (name: string, property: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject) => {
    const fieldCount = arrayFields[name] || 1;
    const type = getPropertyType(property);

    return (
      <div key={name} className="flex items-center gap-4 px-6 py-3 hover:bg-muted">
        <Label className="min-w-[180px] text-sm">{name}</Label>
        <div className="flex-1 space-y-2">
          {Array.from({ length: fieldCount }).map((_, index) => (
            <div key={`${name}-${index}`} className="flex gap-2">
              {type === 'number' || type === 'integer' ? (
                <Input
                  type="number"
                  {...register(`${name}.${index}`, { valueAsNumber: true })}
                  className="flex-1 h-9"
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setValue(`${name}.${index}`, value);
                    const values = watch(name) || [];
                    values[index] = value;
                    setFormData(prev => ({ ...prev, [name]: values }));
                  }}
                />
              ) : (
                <Input
                  {...register(`${name}.${index}`)}
                  className="flex-1 h-9"
                  onChange={(e) => {
                    setValue(`${name}.${index}`, e.target.value);
                    const values = watch(name) || [];
                    values[index] = e.target.value;
                    setFormData(prev => ({ ...prev, [name]: values }));
                  }}
                />
              )}
              {index === fieldCount - 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setArrayFields(prev => ({ ...prev, [name]: prev[name] + 1 || 2 }))}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              )}
              {fieldCount > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => {
                    const values = watch(name) || [];
                    values.splice(index, 1);
                    setValue(name, values);
                    setFormData(prev => ({ ...prev, [name]: values }));
                    if (index === fieldCount - 1) {
                      setArrayFields(prev => ({ ...prev, [name]: prev[name] - 1 }));
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderField = (name: string, property: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject) => {
    if (name === 'type') return null;

    const resolvedProperty = resolveSchema(property);

    if (isArrayType(property)) {
      return renderArrayField(name, property);
    }

    if (resolvedProperty.const) {
      return (
        <div key={name} className="flex items-center gap-4 px-6 py-3 hover:bg-muted">
          <Label className="min-w-[180px] text-sm">{name}</Label>
          <Input 
            value={resolvedProperty.const} 
            disabled 
            {...register(name)}
            className="flex-1 h-9"
          />
        </div>
      );
    }

    if (resolvedProperty.type === 'object' && resolvedProperty.properties) {
      return (
        <div key={name} className="border-t border-b">
          <div className="px-6 py-3">
            <Label className="text-sm font-medium">{name}</Label>
          </div>
          {Object.entries(resolvedProperty.properties).map(([propName, propSchema]) => {
            return renderField(
              `${name}.${propName}`,
              propSchema as OpenAPIV3.SchemaObject
            );
          })}
        </div>
      );
    }

    switch (resolvedProperty.type) {
      case 'string':
        if (resolvedProperty.enum) {
          return (
            <div key={name} className="flex items-center gap-4 px-6 py-3 hover:bg-muted">
              <Label className="min-w-[180px] text-sm">{name}</Label>
              <Select 
                onValueChange={(value) => {
                  setValue(name, value);
                  setFormData(prev => ({ ...prev, [name]: value }));
                }}
              >
                <SelectTrigger className="flex-1 h-9">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {resolvedProperty.enum.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        return (
          <div key={name} className="flex items-center gap-4 px-6 py-3 hover:bg-muted">
            <Label className="min-w-[180px] text-sm">{name}</Label>
            <Input 
              {...register(name)}
              className="flex-1 h-9"
              onChange={(e) => {
                setValue(name, e.target.value);
                setFormData(prev => ({ ...prev, [name]: e.target.value }));
              }}
              placeholder={resolvedProperty.description}
            />
          </div>
        );
      
      case 'number':
      case 'integer':
        return (
          <div key={name} className="flex items-center gap-4 px-6 py-3 hover:bg-muted">
            <Label className="min-w-[180px] text-sm">{name}</Label>
            <Input
              type="number"
              {...register(name, { 
                valueAsNumber: true,
                min: resolvedProperty.minimum,
                max: resolvedProperty.maximum
              })}
              className="flex-1 h-9"
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setValue(name, value);
                setFormData(prev => ({ ...prev, [name]: value }));
              }}
              placeholder={resolvedProperty.description}
            />
          </div>
        );
      
      case 'boolean':
        return (
          <div key={name} className="flex items-center gap-4 px-6 py-3 hover:bg-muted">
            <Label className="min-w-[180px] text-sm">{name}</Label>
            <div className="flex-1">
              <Checkbox
                id={name}
                className="h-4 w-4"
                onCheckedChange={(checked) => {
                  setValue(name, checked);
                  setFormData(prev => ({ ...prev, [name]: checked }));
                }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
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

  const getBlockDisplayName = (section: string, blockType: string) => {
    if (section === 'initialize') return 'Initialize';
    const sectionBlocks = blocks[section] || [];
    const block = sectionBlocks.find(b => b.type === blockType);
    return block?.displayName || blockType;
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
      <div className="w-[240px] border-r overflow-y-auto overflow-x-hidden">
        <div className="space-y-1 p-6">
          <button
            className={cn(
              "w-full text-left px-3 py-1.5 text-sm transition-colors hover:bg-muted text-ellipsis overflow-hidden whitespace-nowrap",
              selectedSection === 'initialize'
                ? "text-primary"
                : "text-muted-foreground"
            )}
            onClick={() => {
              setSelectedSection('initialize');
              setSelectedBlock('Initialize');
            }}
          >
            Initialize
          </button>
          {Object.entries(sections).map(([sectionName, sectionSchema]) => (
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
                    onClick={() => handleAddBlock(sectionName)}
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
                        onClick={() => {
                          setSelectedSection(sectionName);
                          setSelectedBlock(type);
                        }}
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
                            setEditedName(displayName);
                            setIsEditDialogOpen(true);
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
                  
                  return Object.entries(blockSchema.properties).map(([name, property]) => {
                    return renderField(name, property as OpenAPIV3.SchemaObject);
                  });
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