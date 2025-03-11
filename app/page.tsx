"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { SchemaForm } from "@/lib/schema-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, ChevronDown, ChevronUp, LayoutTemplate, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChatAgent } from "@/components/chat-agent";

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [editorOnRight, setEditorOnRight] = useState(false);
  const [showChat, setShowChat] = useState(true);

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
    const pathParts = path.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    
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
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Loading API specification...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <div 
        className={cn(
          "w-[400px] border-r transition-all duration-300 ease-in-out",
          !showChat && "w-0 opacity-0 overflow-hidden"
        )}
      >
        <ChatAgent />
      </div>
      <div className="flex-1 relative">
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 rounded-none border-y border-r h-12 w-6 bg-background"
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <div 
          className={cn(
            "absolute right-8 top-8 rounded-lg border shadow-lg bg-background transition-all duration-300 ease-in-out",
            showChat ? "w-[900px]" : "w-[1100px]"
          )}
        >
          <div className="px-6 py-4 border-b">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
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
                            {displayName}
                          </SelectItem>
                        ))
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                  <Switch
                    checked={editorOnRight}
                    onCheckedChange={setEditorOnRight}
                    size="sm"
                  />
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {error && (
            <div className="px-6 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="h-[calc(100vh-12rem)]">
            {spec && (
              selectedOperation && schema ? (
                <SchemaForm 
                  schema={schema} 
                  spec={spec} 
                  onSubmit={handleSubmit}
                  editorOnRight={editorOnRight}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-lg text-muted-foreground">Select a lab to begin</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}