"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { SchemaForm } from "@/lib/schema-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

const API_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    loadSpec();
  }, []);

  useEffect(() => {
    if (selectedPath && selectedMethod) {
      setSidebarOpen(false);
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

  if (loading && !spec) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-none px-6 py-4 border-b">
          <div className="flex items-center justify-end max-w-[1400px] mx-auto">
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
        <div className="flex items-center justify-end max-w-[1400px] mx-auto">
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
          <div className="h-full relative flex-1">
            {/* Sidebar toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "fixed top-[4.5rem] z-30 transition-all duration-300",
                sidebarOpen ? "left-[276px]" : "left-6"
              )}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {/* Left sidebar */}
            <div
              className={cn(
                "fixed top-[4.125rem] bottom-0 left-0 w-[300px] overflow-y-auto border-r bg-background transition-transform duration-300 z-20",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="p-6 space-y-4">
                {Object.entries(spec.paths).map(([path, pathItem]) => (
                  <Card key={path} className="p-4">
                    <h3 className="text-lg font-semibold mb-4 break-words font-mono text-[0.7em]">{path}</h3>
                    <div className="space-y-2">
                      {Object.entries(pathItem as OpenAPIV3.PathItemObject).map(
                        ([method, operation]) => {
                          if (method === 'parameters') return null;
                          const op = operation as OpenAPIV3.OperationObject;
                          return (
                            <Button
                              key={method}
                              variant={
                                selectedPath === path && selectedMethod === method
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                setSelectedPath(path);
                                setSelectedMethod(method);
                                setResponse(null);
                                setError(null);
                              }}
                              className="w-full justify-start"
                            >
                              <span className="uppercase font-mono mr-2">
                                {method}
                              </span>
                              {op.summary || op.operationId || path}
                            </Button>
                          );
                        }
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Main content */}
            <div
              className={cn(
                "min-h-full overflow-y-auto transition-all duration-300 px-6",
                sidebarOpen ? "ml-[300px]" : "ml-0"
              )}
            >
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