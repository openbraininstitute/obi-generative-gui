"use client";

import { OpenAPIV3 } from "openapi-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircle, X } from "lucide-react";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { cn } from "@/lib/utils";

interface BlockData {
  id: string;
  type: string;
  displayName: string;
}

interface FormFieldProps {
  name: string;
  property: OpenAPIV3.SchemaObject;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  resolveSchema: (schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined) => OpenAPIV3.SchemaObject;
  arrayFields: Record<string, number>;
  setArrayFields: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  blocks: Record<string, BlockData[]>;
}

export function FormField({
  name,
  property,
  register,
  setValue,
  watch,
  resolveSchema,
  arrayFields,
  setArrayFields,
  setFormData,
  blocks,
}: FormFieldProps) {
  if (name === 'type') return null;

  const resolvedProperty = resolveSchema(property);
  const currentValue = watch(name);

  const hasFromIDType = (property: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): boolean => {
    const resolved = resolveSchema(property);
    
    // Check if the schema reference contains FromID
    if ('$ref' in property && property.$ref.includes('FromID')) {
      return true;
    }
    
    // Check if the title or type contains FromID
    if (resolved.title?.includes('FromID')) {
      return true;
    }
    
    // Check array items
    if (resolved.type === 'array' && resolved.items) {
      return hasFromIDType(resolved.items as OpenAPIV3.SchemaObject);
    }
    
    // Check anyOf schemas
    if (resolved.anyOf) {
      return resolved.anyOf.some(schema => 
        hasFromIDType(schema as OpenAPIV3.SchemaObject)
      );
    }
    
    return false;
  };

  const isFromIDType = (property: OpenAPIV3.SchemaObject): boolean => {
    return hasFromIDType(property);
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

  const isBlockReference = (property: OpenAPIV3.SchemaObject): boolean => {
    if (property.anyOf) {
      return property.anyOf.some(schema => {
        const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
        return resolved.type === 'object' && resolved.properties?.type?.const;
      });
    }
    return property.type === 'object' && property.properties?.type?.const !== undefined;
  };

  const getAvailableBlockTypes = (property: OpenAPIV3.SchemaObject): string[] => {
    if (property.anyOf) {
      return property.anyOf.map(schema => {
        const resolved = resolveSchema(schema as OpenAPIV3.SchemaObject);
        return resolved.properties?.type?.const as string;
      }).filter(Boolean);
    }
    if (property.type === 'object' && property.properties?.type?.const) {
      return [property.properties.type.const as string];
    }
    return [];
  };

  const getAvailableBlocks = (blockTypes: string[]): BlockData[] => {
    return Object.values(blocks)
      .flat()
      .filter(block => blockTypes.includes(block.type));
  };

  const renderArrayField = () => {
    const fieldCount = arrayFields[name] || 1;
    const type = getPropertyType(property);
    const itemSchema = resolveSchema((resolvedProperty.items || {}) as OpenAPIV3.SchemaObject);
    const values = watch(name) || [];

    return (
      <div className="flex items-center px-3 py-1.5 hover:bg-muted/60 dark:hover:bg-muted/40">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className="cursor-pointer">
              <Label className={cn(
                "text-sm w-[65%]",
                isFromIDType(resolvedProperty) ? "text-red-500" : "text-muted-foreground"
              )}>{name}</Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>{resolvedProperty.description || 'No description available'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="w-[35%] space-y-1">
          {Array.from({ length: fieldCount }).map((_, index) => (
            <div key={`${name}-${index}`} className="flex gap-1">
              {isBlockReference(itemSchema) ? (
                <Select 
                  value={values[index]?.type ? `${values[index].type}|${values[index].name}` : undefined}
                  onValueChange={(value) => {
                    const [type, displayName] = value.split('|');
                    const newValues = [...values];
                    newValues[index] = { type, name: displayName };
                    setValue(name, newValues);
                    setFormData({ [name]: newValues });
                  }}
                >
                  <SelectTrigger className="flex-1 h-6 text-sm bg-muted/70 dark:bg-muted/40">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableBlocks(getAvailableBlockTypes(itemSchema)).map((block) => (
                      <SelectItem 
                        key={block.id} 
                        value={`${block.type}|${block.displayName}`}
                        className="text-sm"
                      >
                        {block.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : type === 'number' || type === 'integer' ? (
                <Input
                  type="number"
                  value={values[index] || ''}
                  {...register(`${name}.${index}`, { valueAsNumber: true })}
                  className="flex-1 h-6 text-sm bg-muted/70 dark:bg-muted/40"
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    const newValues = [...values];
                    newValues[index] = value;
                    setValue(name, newValues);
                    setFormData({ [name]: newValues });
                  }}
                />
              ) : type === 'string' && itemSchema.enum ? (
                <Select 
                  value={values[index]}
                  onValueChange={(value) => {
                    const newValues = [...values];
                    newValues[index] = value;
                    setValue(name, newValues);
                    setFormData({ [name]: newValues });
                  }}
                >
                  <SelectTrigger className="flex-1 h-6 text-sm bg-muted/70 dark:bg-muted/40">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemSchema.enum.map((option) => (
                      <SelectItem key={option} value={option} className="text-sm">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={values[index] || ''}
                  {...register(`${name}.${index}`)}
                  className="flex-1 h-6 text-sm bg-muted/70 dark:bg-muted/40"
                  onChange={(e) => {
                    const newValues = [...values];
                    newValues[index] = e.target.value;
                    setValue(name, newValues);
                    setFormData({ [name]: newValues });
                  }}
                />
              )}
              {index === fieldCount - 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setArrayFields(prev => ({ ...prev, [name]: prev[name] + 1 || 2 }))}
                >
                  <PlusCircle className="h-3 w-3" />
                </Button>
              )}
              {fieldCount > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    const newValues = [...values];
                    newValues.splice(index, 1);
                    setValue(name, newValues);
                    setFormData({ [name]: newValues });
                    if (index === fieldCount - 1) {
                      setArrayFields(prev => ({ ...prev, [name]: prev[name] - 1 }));
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isArrayType(property)) {
    return renderArrayField();
  }

  if (isBlockReference(resolvedProperty)) {
    const blockTypes = getAvailableBlockTypes(resolvedProperty);
    const availableBlocks = getAvailableBlocks(blockTypes);
    
    return (
      <div className="flex items-center px-3 py-1.5 hover:bg-muted/60 dark:hover:bg-muted/40">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className="cursor-pointer">
              <Label className={cn(
                "text-sm w-[65%]",
                isFromIDType(resolvedProperty) ? "text-red-500" : "text-muted-foreground"
              )}>{name}</Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>{resolvedProperty.description || 'No description available'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="w-[35%]">
          <Select 
            value={currentValue?.type ? `${currentValue.type}|${currentValue.name}` : undefined}
            onValueChange={(value) => {
              const [type, displayName] = value.split('|');
              setValue(name, { type, name: displayName });
              setFormData({ [name]: { type, name: displayName } });
            }}
          >
            <SelectTrigger className="h-6 text-sm bg-muted/70 dark:bg-muted/40">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {availableBlocks.map((block) => (
                <SelectItem 
                  key={block.id} 
                  value={`${block.type}|${block.displayName}`}
                  className="text-sm"
                >
                  {block.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  if (resolvedProperty.const) {
    return (
      <div className="flex items-center px-3 py-1.5 hover:bg-muted/60 dark:hover:bg-muted/40">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className="cursor-pointer">
              <Label className={cn(
                "text-sm w-[65%]",
                isFromIDType(resolvedProperty) ? "text-red-500" : "text-muted-foreground"
              )}>{name}</Label>
            </TooltipTrigger>
            <TooltipContent>
              <p>{resolvedProperty.description || 'No description available'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="w-[35%]">
          <Input 
            value={resolvedProperty.const} 
            disabled 
            {...register(name)}
            className="h-6 text-sm bg-muted/70 dark:bg-muted/40"
          />
        </div>
      </div>
    );
  }

  if (resolvedProperty.type === 'object' && resolvedProperty.properties) {
    return (
      <div>
        <div className="px-3 py-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild className="cursor-pointer">
                <Label className="text-sm font-medium text-muted-foreground">{name}</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolvedProperty.description || 'No description available'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {Object.entries(resolvedProperty.properties).map(([propName, propSchema]) => (
          <FormField
            key={`${name}.${propName}`}
            name={`${name}.${propName}`}
            property={propSchema as OpenAPIV3.SchemaObject}
            register={register}
            setValue={setValue}
            watch={watch}
            resolveSchema={resolveSchema}
            arrayFields={arrayFields}
            setArrayFields={setArrayFields}
            setFormData={setFormData}
            blocks={blocks}
          />
        ))}
      </div>
    );
  }

  switch (resolvedProperty.type) {
    case 'string':
      if (resolvedProperty.enum) {
        return (
          <div className="flex items-center px-3 py-1.5 hover:bg-muted/60 dark:hover:bg-muted/40">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild className="cursor-pointer">
                  <Label className={cn(
                    "text-sm w-[65%]",
                    isFromIDType(resolvedProperty) ? "text-red-500" : "text-muted-foreground"
                  )}>{name}</Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{resolvedProperty.description || 'No description available'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="w-[35%]">
              <Select 
                value={currentValue}
                onValueChange={(value) => {
                  setValue(name, value);
                  setFormData({ [name]: value });
                }}
              >
                <SelectTrigger className="h-6 text-sm bg-muted/70 dark:bg-muted/40">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {resolvedProperty.enum.map((option) => (
                    <SelectItem key={option} value={option} className="text-sm">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      }
      return (
        <div className="flex items-center px-3 py-1.5 hover:bg-muted/60 dark:hover:bg-muted/40">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild className="cursor-pointer">
                <Label className={cn(
                  "text-sm w-[65%]",
                  isFromIDType(resolvedProperty) ? "text-red-500" : "text-muted-foreground"
                )}>{name}</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolvedProperty.description || 'No description available'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-[35%]">
            <Input 
              value={currentValue || ''}
              {...register(name)}
              className="h-6 text-sm bg-muted/70 dark:bg-muted/40"
              onChange={(e) => {
                setValue(name, e.target.value);
                setFormData({ [name]: e.target.value });
              }}
              placeholder={resolvedProperty.description}
            />
          </div>
        </div>
      );
    
    case 'number':
    case 'integer':
      return (
        <div className="flex items-center px-3 py-1.5 hover:bg-muted/60 dark:hover:bg-muted/40">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild className="cursor-pointer">
                <Label className={cn(
                  "text-sm w-[35%]",
                  isFromIDType(resolvedProperty) ? "text-red-500" : "text-muted-foreground"
                )}>{name}</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolvedProperty.description || 'No description available'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-[65%]">
            <Input
              type="number"
              value={currentValue || ''}
              {...register(name, { 
                valueAsNumber: true,
                min: resolvedProperty.minimum,
                max: resolvedProperty.maximum
              })}
              className="h-6 text-sm bg-muted/70 dark:bg-muted/40"
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null;
                setValue(name, value);
                setFormData({ [name]: value });
              }}
              placeholder={resolvedProperty.description}
            />
          </div>
        </div>
      );
    
    case 'boolean':
      return (
        <div className="flex items-center px-3 py-1.5 hover:bg-muted/60 dark:hover:bg-muted/40">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild className="cursor-pointer">
                <Label className="text-sm text-muted-foreground w-[65%]">{name}</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>{resolvedProperty.description || 'No description available'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-[35%]">
            <Checkbox
              id={name}
              checked={currentValue || false}
              className="h-4 w-4"
              onCheckedChange={(checked) => {
                setValue(name, checked);
                setFormData({ [name]: checked });
              }}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}