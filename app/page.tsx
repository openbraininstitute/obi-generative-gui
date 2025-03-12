"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { SchemaForm } from "@/lib/schema-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, ChevronDown, ChevronUp, LayoutTemplate } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ModelingInterface } from "@/components/modeling-interface";
import { ChatAgent } from "@/components/chat-agent";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedTask, setSelectedTask] = useState("a");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [editorOnRight, setEditorOnRight] = useState(false);

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
      <div className="h-screen flex items-center justify-center">
        <p className="text-lg text-white">Loading API specification...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="h-full">
            <ChatAgent />
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={80}>
          <div className="h-full flex flex-col">
            <div className="flex-none">
              <ModelingInterface />
            </div>
            <div className="flex-1 p-8">
              <div className="h-full rounded-lg border shadow-lg bg-background overflow-hidden">
                <div className="flex-none px-6 py-4 border-b">
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
                    <div className="flex items-center gap-3">
                      <Label>Task:</Label>
                      <div className="w-[100px]">
                        <Select
                          value={selectedTask}
                          onValueChange={setSelectedTask}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a">A</SelectItem>
                            <SelectItem value="b">B</SelectItem>
                            <SelectItem value="c">C</SelectItem>
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
                  <div className="flex-none px-6 py-4">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </div>
                )}

                <div className="flex-1 h-[calc(100%-4rem)]">
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}