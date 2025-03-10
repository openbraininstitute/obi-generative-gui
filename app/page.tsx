"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { SchemaForm } from "@/lib/schema-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    loadSpec();
  }, []);

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

  const endpoints = spec ? Object.entries(spec.paths).map(([path, pathItem]) => ({
    path,
    methods: Object.entries(pathItem as OpenAPIV3.PathItemObject)
      .filter(([method]) => method !== 'parameters')
      .map(([method, operation]) => ({
        method,
        operation: operation as OpenAPIV3.OperationObject
      }))
  })) : [];

  if (loading && !spec) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-none px-6 py-4 border-b">
          <div className="flex items-center justify-between max-w-[1400px] mx-auto">
            <div className="w-[240px]">
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Select endpoint" />
                </SelectTrigger>
              </Select>
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
      <div className="flex-none px-6 py-4 border-b">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
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
                <SelectValue placeholder="Select endpoint" />
              </SelectTrigger>
              <SelectContent>
                {endpoints.map(({ path, methods }) => (
                  methods.map(({ method, operation }) => (
                    <SelectItem key={`${path}|${method}`} value={`${path}|${method}`}>
                      <span className="uppercase font-mono mr-2">{method}</span>
                      {operation.summary || operation.operationId || path}
                    </SelectItem>
                  ))
                ))}
              </SelectContent>
            </Select>
          </div>
          <ThemeToggle />
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

      {spec && (
        <div className="flex-1 overflow-hidden flex">
          {/* Main content */}
          <div className="w-1/2 min-h-full overflow-y-auto px-6">
            <div className="py-6">
              {selectedOperation && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    {selectedOperation.summary || selectedOperation.operationId || selectedPath}
                  </h2>
                  {selectedOperation.description && (
                    <p className="text-muted-foreground mb-4">{selectedOperation.description}</p>
                  )}
                  {schema ? (
                    <SchemaForm schema={schema} spec={spec} onSubmit={handleSubmit} />
                  ) : (
                    <p className="text-muted-foreground">This endpoint doesn't require a request body.</p>
                  )}
                </Card>
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
          </div>

          {/* Right image column */}
          <div className={cn(
            "w-1/2 fixed right-0 top-[4.125rem] bottom-0 flex items-center justify-center transition-colors duration-300",
            theme === 'dark' ? 'bg-black' : 'bg-white'
          )}>
            <div className="w-1/2 h-1/2 relative flex items-center justify-center">
              <img 
                src="/images/Microcircuits.png" 
                alt="Microcircuits visualization"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}