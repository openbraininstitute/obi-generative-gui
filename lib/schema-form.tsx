"use client";

import { useForm } from "react-hook-form";
import { OpenAPIV3 } from "openapi-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { resolveSchemaRef } from "@/lib/api-client";
import { PlusCircle, Settings } from "lucide-react";
import { useState } from "react";

interface SchemaFormProps {
  schema: OpenAPIV3.SchemaObject;
  spec: OpenAPIV3.Document;
  onSubmit: (data: any) => void;
}

export function SchemaForm({ schema, spec, onSubmit }: SchemaFormProps) {
  const { register, handleSubmit, setValue, watch, getValues } = useForm();
  const [selectedSection, setSelectedSection] = useState<string | null>("initialize");
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const resolveSchema = (schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): OpenAPIV3.SchemaObject => {
    if ('$ref' in schema) {
      return resolveSchemaRef(spec, schema.$ref);
    }
    return schema;
  };

  const renderField = (name: string, property: OpenAPIV3.SchemaObject, path: string, required: boolean = false) => {
    const label = `${name}${required ? ' *' : ''}`;

    if (property.const) {
      return (
        <div className="mb-4">
          <Label>{label}</Label>
          <Input value={property.const} disabled />
          {property.description && (
            <p className="text-sm text-muted-foreground mt-1">{property.description}</p>
          )}
        </div>
      );
    }

    switch (property.type) {
      case 'string':
        if (property.enum) {
          return (
            <div className="mb-4">
              <Label>{label}</Label>
              <Select onValueChange={(value) => setValue(path, value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {property.enum.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {property.description && (
                <p className="text-sm text-muted-foreground mt-1">{property.description}</p>
              )}
            </div>
          );
        }
        return (
          <div className="mb-4">
            <Label>{label}</Label>
            <Input {...register(path)} placeholder={property.description} />
            {property.description && (
              <p className="text-sm text-muted-foreground mt-1">{property.description}</p>
            )}
          </div>
        );
      
      case 'number':
      case 'integer':
        return (
          <div className="mb-4">
            <Label>{label}</Label>
            <Input
              type="number"
              {...register(path, { 
                valueAsNumber: true,
                min: property.minimum,
                max: property.maximum
              })}
              placeholder={property.description}
            />
            {property.description && (
              <p className="text-sm text-muted-foreground mt-1">{property.description}</p>
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <div className="mb-4 flex items-center space-x-2">
            <Checkbox
              id={path}
              onCheckedChange={(checked) => setValue(path, checked)}
            />
            <Label htmlFor={path}>{label}</Label>
            {property.description && (
              <p className="text-sm text-muted-foreground ml-2">{property.description}</p>
            )}
          </div>
        );

      case 'array':
        return (
          <div className="mb-4">
            <Label>{label}</Label>
            <Textarea
              {...register(path)}
              placeholder="Enter values, one per line"
              className="mt-1"
              onChange={(e) => {
                const values = e.target.value.split('\n').filter(Boolean);
                setValue(path, values);
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderBlockParameters = (blockSchema: OpenAPIV3.SchemaObject) => {
    if (!blockSchema.properties) return null;

    return Object.entries(blockSchema.properties).map(([name, property]) => {
      const resolvedProperty = resolveSchema(property as OpenAPIV3.SchemaObject);
      const isRequired = blockSchema.required?.includes(name) || false;
      return renderField(name, resolvedProperty, `${selectedSection}.${selectedBlock}.${name}`, isRequired);
    });
  };

  const resolvedSchema = resolveSchema(schema);
  if (!resolvedSchema.properties) return <div>No schema available</div>;

  const sections = {
    initialize: resolvedSchema.properties.initialize,
    timestamps: resolvedSchema.properties.timestamps,
    stimuli: resolvedSchema.properties.stimuli,
    recordings: resolvedSchema.properties.recordings,
    neuron_sets: resolvedSchema.properties.neuron_sets,
    synapse_sets: resolvedSchema.properties.synapse_sets,
  };

  const getAvailableBlocks = (section: string) => {
    if (section === 'initialize') {
      return ['Initialize'];
    }

    const sectionSchema = resolveSchema(sections[section as keyof typeof sections]);
    if (!sectionSchema.additionalProperties) return [];

    const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                        [sectionSchema.additionalProperties];
    
    return blockSchemas.map(schema => {
      const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
      return resolved.title || resolved.const || 'Unnamed Block';
    });
  };

  const getBlockSchema = () => {
    if (!selectedSection || !selectedBlock) return null;
    
    if (selectedSection === 'initialize') {
      return resolveSchema(sections.initialize);
    }

    const sectionSchema = resolveSchema(sections[selectedSection as keyof typeof sections]);
    if (!sectionSchema.additionalProperties) return null;

    const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                        [sectionSchema.additionalProperties];
    
    const blockSchema = blockSchemas.find(schema => {
      const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
      return resolved.title === selectedBlock || resolved.const === selectedBlock;
    });

    return blockSchema ? resolveSchema(blockSchema as OpenAPIV3.SchemaObject) : null;
  };

  return (
    <div className="grid grid-cols-[300px,1fr] gap-6">
      {/* Left sidebar */}
      <div className="space-y-4">
        {Object.entries(sections).map(([sectionName, sectionSchema]) => (
          <Card key={sectionName} className="p-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
            </h3>
            <div className="space-y-2">
              {sectionName === 'initialize' ? (
                <Button
                  variant={selectedSection === sectionName ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedSection(sectionName);
                    setSelectedBlock('Initialize');
                  }}
                >
                  Initialize
                </Button>
              ) : (
                <>
                  {getAvailableBlocks(sectionName).map((blockName) => (
                    <Button
                      key={blockName}
                      variant={selectedSection === sectionName && selectedBlock === blockName ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedSection(sectionName);
                        setSelectedBlock(blockName);
                      }}
                    >
                      {blockName}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => {
                      // Handle adding new block
                    }}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add {sectionName.slice(0, -1)}
                  </Button>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Right content */}
      <div>
        {selectedSection && selectedBlock && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">{selectedBlock}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {renderBlockParameters(getBlockSchema()!)}
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}