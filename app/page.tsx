"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { SchemaForm } from "@/lib/schema-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);

  useEffect(() => {
    loadSpec();
  }, []);

  useEffect(() => {
    if (selectedPath && selectedMethod) {
      setShowTopBar(false);
    }
  }, [selectedPath, selectedMethod]);

  const loadSpec = async () => {
    setLoading(true);
    setError(null);
    setSpec(null);

    try {
      const spec = await fetchOpenAPISpec(API_URL);
      setSpec(spec);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load OpenAPI spec');
      setSpec(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await callEndpoint(API_URL, selectedMethod, selectedPath, data);
      setResponse(result);
      
      if (!result.ok) {
        setError(`API Error: ${result.data?.detail || 'Unknown error occurred'}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to call endpoint');
    } finally {
      setLoading(false);
    }
  };

  const selectedOperation = spec && selectedPath && selectedMethod
    ? (spec.paths[selectedPath]?.[selectedMethod.toLowerCase()] as OpenAPIV3.OperationObject)
    : null;

  const schema = spec && selectedPath && selectedMethod
    ? getSchemaFromPath(spec, selectedPath, selectedMethod)
    : null;

  const getEndpointDisplayName = (path: string, method: string, operation: OpenAPIV3.OperationObject) => {
    // Extract the last part of the path
    const pathParts = path.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    
    // Convert to title case and remove underscores
    return lastPart
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const endpoints = spec ? Object.entries(spec.paths).map(([path, pathItem]) => ({
    path,
    methods: Object.entries(pathItem as OpenAPIV3.PathItemObject)
      .filter(([method]) => method !== 'parameters')
      .map(([method, operation]) => ({
        method,
        operation: operation as OpenAPIV3.OperationObject,
        displayName: getEndpointDisplayName(path, method, operation as OpenAPIV3.OperationObject)
      }))
  })) : [];

  if (loading && !spec) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-none px-6 py-4 border-b">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8"
              disabled
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 ml-6">
              <Label>Lab:</Label>
              <div className="w-[240px]">
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                </Select>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-lg text-muted-foreground">Loading API specification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div 
        className={cn(
          "flex-none transition-all duration-300 ease-in-out",
          showTopBar ? "h-[60px] opacity-100" : "h-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8"
              onClick={() => setShowTopBar(!showTopBar)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 ml-6">
              <Label>Lab:</Label>
              <div className="w-[240px]">
                <Select
                  value={selectedPath && selectedMethod ? `${selectedPath}|${selectedMethod}` : undefined}
                  onValueChange={(value) => {
                    const [path, method] = value.split('|');
                    setSelectedPath(path);
                    setSelectedMethod(method);
                    setResponse(null);
                    setError(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lab" />
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map(({ path, methods }) => (
                      methods.map(({ method, operation, displayName }) => (
                        <SelectItem key={`${path}|${method}`} value={`${path}|${method}`}>
                          <span className="uppercase font-mono mr-2">{method}</span>
                          {displayName}
                        </SelectItem>
                      ))
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {!showTopBar && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-4 top-2 w-8 h-8"
          onClick={() => setShowTopBar(true)}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {error && (
        <div className="flex-none px-6 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {spec && (
        <div className="flex-1 overflow-hidden">
          {selectedOperation && schema ? (
            <SchemaForm schema={schema} spec={spec} onSubmit={handleSubmit} />
          ) : (
            <div className="flex-1" />
          )}

          {response && (
            <Card className="p-6 mt-6">
              <h2 className="text-2xl font-bold mb-4">Response</h2>
              <div className={`bg-muted p-4 rounded-lg ${!response.ok ? 'border-destructive border-2' : ''}`}>
                <div className="font-semibold mb-2">
                  Status: {response.status}
                </div>
                <pre className="overflow-auto">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}