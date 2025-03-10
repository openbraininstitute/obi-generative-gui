"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { SchemaForm } from "@/lib/schema-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = "http://127.0.0.1:8000";

export default function EndpointPage() {
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const path = searchParams.get('path');
  const method = searchParams.get('method');

  useEffect(() => {
    if (!path || !method) {
      router.push('/');
      return;
    }
    loadSpec();
  }, [path, method]);

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
    if (!path || !method) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await callEndpoint(API_URL, method, path, data);
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

  const selectedOperation = spec && path && method
    ? (spec.paths[path]?.[method.toLowerCase()] as OpenAPIV3.OperationObject)
    : null;

  const schema = spec && path && method
    ? getSchemaFromPath(spec, path, method)
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
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Endpoints
          </Button>
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

      <div className="flex-1 flex">
        {/* Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {selectedOperation && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <span className="uppercase font-mono text-sm px-2 py-1 bg-primary text-primary-foreground rounded">
                    {method}
                  </span>
                  <h1 className="text-2xl font-bold">
                    {selectedOperation.summary || selectedOperation.operationId || path}
                  </h1>
                </div>
                {selectedOperation.description && (
                  <p className="text-muted-foreground mb-6">{selectedOperation.description}</p>
                )}
                <div className="font-mono text-sm mb-8 p-4 bg-muted rounded-lg">
                  {path}
                </div>
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
    </div>
  );
}