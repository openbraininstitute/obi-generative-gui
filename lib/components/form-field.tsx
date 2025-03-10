"use client";

import { OpenAPIV3 } from "openapi-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, X } from "lucide-react";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

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
}: FormFieldProps) {
  if (name === 'type') return null;

  const resolvedProperty = resolveSchema(property);

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

  const renderArrayField = () => {
    const fieldCount = arrayFields[name] || 1;
    const type = getPropertyType(property);

    return (
      <div className="flex items-center gap-4 px-3 py-1.5 hover:bg-muted">
        <Label className="text-sm text-muted-foreground">{name}</Label>
        <div className="flex-1 space-y-1">
          {Array.from({ length: fieldCount }).map((_, index) => (
            <div key={`${name}-${index}`} className="flex gap-1">
              {type === 'number' || type === 'integer' ? (
                <Input
                  type="number"
                  {...register(`${name}.${index}`, { valueAsNumber: true })}
                  className="flex-1 h-6 text-sm"
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
                  className="flex-1 h-6 text-sm"
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
                    const values = watch(name) || [];
                    values.splice(index, 1);
                    setValue(name, values);
                    setFormData(prev => ({ ...prev, [name]: values }));
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

  if (resolvedProperty.const) {
    return (
      <div className="flex items-center gap-4 px-3 py-1.5 hover:bg-muted">
        <Label className="text-sm text-muted-foreground">{name}</Label>
        <Input 
          value={resolvedProperty.const} 
          disabled 
          {...register(name)}
          className="flex-1 h-6 text-sm"
        />
      </div>
    );
  }

  if (resolvedProperty.type === 'object' && resolvedProperty.properties) {
    return (
      <div className="border-t border-b">
        <div className="px-3 py-1.5">
          <Label className="text-sm font-medium text-muted-foreground">{name}</Label>
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
          />
        ))}
      </div>
    );
  }

  switch (resolvedProperty.type) {
    case 'string':
      if (resolvedProperty.enum) {
        return (
          <div className="flex items-center gap-4 px-3 py-1.5 hover:bg-muted">
            <Label className="text-sm text-muted-foreground">{name}</Label>
            <Select 
              onValueChange={(value) => {
                setValue(name, value);
                setFormData(prev => ({ ...prev, [name]: value }));
              }}
            >
              <SelectTrigger className="flex-1 h-6 text-sm">
                <SelectValue placeholder="Select an option" />
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
        );
      }
      return (
        <div className="flex items-center gap-4 px-3 py-1.5 hover:bg-muted">
          <Label className="text-sm text-muted-foreground">{name}</Label>
          <Input 
            {...register(name)}
            className="flex-1 h-6 text-sm"
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
        <div className="flex items-center gap-4 px-3 py-1.5 hover:bg-muted">
          <Label className="text-sm text-muted-foreground">{name}</Label>
          <Input
            type="number"
            {...register(name, { 
              valueAsNumber: true,
              min: resolvedProperty.minimum,
              max: resolvedProperty.maximum
            })}
            className="flex-1 h-6 text-sm"
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
        <div className="flex items-center gap-4 px-3 py-1.5 hover:bg-muted">
          <Label className="text-sm text-muted-foreground">{name}</Label>
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
}