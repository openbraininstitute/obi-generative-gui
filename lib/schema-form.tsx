"use client";

import { useForm } from "react-hook-form";
import { OpenAPIV3 } from "openapi-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [dialogSection, setDialogSection] = useState<string>("");
  const [blocks, setBlocks] = useState<Record<string, BlockData[]>>({});
  const [isEditingName, setIsEditingName] = useState(false);
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

  const renderArrayField = (name: string, property: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, required: boolean = false) => {
    const fieldCount = arrayFields[name] || 1;
    const type = getPropertyType(property);
    const label = `${name}${required ? ' *' : ''}`;

    return (
      <div key={name} className="mb-4">
        <Label>{label}</Label>
        <div className="space-y-2">
          {Array.from({ length: fieldCount }).map((_, index) => (
            <div key={`${name}-${index}`} className="flex gap-2">
              {type === 'number' || type === 'integer' ? (
                <Input
                  type="number"
                  {...register(`${name}.${index}`, { valueAsNumber: true })}
                  className="flex-1"
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
                  className="flex-1"
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
                  variant="outline"
                  size="icon"
                  onClick={() => setArrayFields(prev => ({ ...prev, [name]: prev[name] + 1 || 2 }))}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              )}
              {fieldCount > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
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

  const renderField = (name: string, property: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, required: boolean = false) => {
    const resolvedProperty = resolveSchema(property);
    const label = `${name}${required ? ' *' : ''}`;

    if (isArrayType(property)) {
      return renderArrayField(name, property, required);
    }

    if (resolvedProperty.const) {
      return (
        <div key={name} className="mb-4">
          <Label>{label}</Label>
          <Input 
            value={resolvedProperty.const} 
            disabled 
            {...register(name)}
          />
          {resolvedProperty.description && (
            <p className="text-sm text-muted-foreground mt-1">{resolvedProperty.description}</p>
          )}
        </div>
      );
    }

    if (resolvedProperty.type === 'object' && resolvedProperty.properties) {
      return (
        <div key={name} className="mb-6 p-4 border rounded-lg">
          <Label className="text-lg font-semibold mb-3">{label}</Label>
          {Object.entries(resolvedProperty.properties).map(([propName, propSchema]) => {
            const isRequired = resolvedProperty.required?.includes(propName) || false;
            return renderField(
              `${name}.${propName}`,
              propSchema as OpenAPIV3.SchemaObject,
              isRequired
            );
          })}
        </div>
      );
    }

    switch (resolvedProperty.type) {
      case 'string':
        if (resolvedProperty.enum) {
          return (
            <div key={name} className="mb-4">
              <Label>{label}</Label>
              <Select 
                onValueChange={(value) => {
                  setValue(name, value);
                  setFormData(prev => ({ ...prev, [name]: value }));
                }}
              >
                <SelectTrigger>
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
              {resolvedProperty.description && (
                <p className="text-sm text-muted-foreground mt-1">{resolvedProperty.description}</p>
              )}
            </div>
          );
        }
        return (
          <div key={name} className="mb-4">
            <Label>{label}</Label>
            <Input 
              {...register(name)}
              onChange={(e) => {
                setValue(name, e.target.value);
                setFormData(prev => ({ ...prev, [name]: e.target.value }));
              }}
              placeholder={resolvedProperty.description}
            />
            {resolvedProperty.description && (
              <p className="text-sm text-muted-foreground mt-1">{resolvedProperty.description}</p>
            )}
          </div>
        );
      
      case 'number':
      case 'integer':
        return (
          <div key={name} className="mb-4">
            <Label>{label}</Label>
            <Input
              type="number"
              {...register(name, { 
                valueAsNumber: true,
                min: resolvedProperty.minimum,
                max: resolvedProperty.maximum
              })}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setValue(name, value);
                setFormData(prev => ({ ...prev, [name]: value }));
              }}
              placeholder={resolvedProperty.description}
            />
            {resolvedProperty.description && (
              <p className="text-sm text-muted-foreground mt-1">{resolvedProperty.description}</p>
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <div key={name} className="mb-4 flex items-center space-x-2">
            <Checkbox
              id={name}
              onCheckedChange={(checked) => {
                setValue(name, checked);
                setFormData(prev => ({ ...prev, [name]: checked }));
              }}
            />
            <Label htmlFor={name}>{label}</Label>
            {resolvedProperty.description && (
              <p className="text-sm text-muted-foreground ml-2">{resolvedProperty.description}</p>
            )}
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
    
    setIsEditingName(false);
  };

  return (
    <div className="flex flex-grow">
      <div className="w-[240px] border-r">
        <div className="space-y-1 p-6">
          <button
            className={cn(
              "w-full text-left px-3 py-1.5 text-sm transition-colors",
              selectedSection === 'initialize'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
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
                  <span className="text-sm font-medium text-muted-foreground">
                    {sectionName.toUpperCase().replace(/_/g, ' ')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 -mr-1.5"
                    onClick={() => handleAddBlock(sectionName)}
                  >
                    <PlusCircle className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1 pl-4">
                  {(blocks[sectionName] || []).map(({ type, displayName }) => (
                    <button
                      key={type}
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-sm transition-colors rounded-sm",
                        selectedSection === sectionName && selectedBlock === type
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                      onClick={() => {
                        setSelectedSection(sectionName);
                        setSelectedBlock(type);
                      }}
                    >
                      {displayName}
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {selectedSection && selectedBlock && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              {selectedSection === 'initialize' || isEditingName ? (
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {isEditingName ? (
                    <>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="text-2xl font-bold h-auto py-0 max-w-[200px]"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUpdateBlockName}
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingName(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    'Initialize'
                  )}
                </h2>
              ) : (
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {getBlockDisplayName(selectedSection, selectedBlock)}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditedName(getBlockDisplayName(selectedSection, selectedBlock));
                      setIsEditingName(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </h2>
              )}
            </div>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              {(() => {
                const blockSchema = getBlockSchema();
                if (!blockSchema?.properties) return null;
                
                return Object.entries(blockSchema.properties).map(([name, property]) => {
                  const isRequired = blockSchema.required?.includes(name) || false;
                  return renderField(name, property as OpenAPIV3.SchemaObject, isRequired);
                });
              })()}
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </Card>
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