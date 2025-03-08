"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { SchemaForm } from "@/lib/schema-form";
import { OpenAPIV3 } from "openapi-types";
import { ServerIcon, SendIcon, FileJson, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000");
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSpec = async () => {
    if (!apiUrl) {
      setError("Please enter a FastAPI URL");
      return;
    }

    setLoading(true);
    setError(null);
    setSpec(null);

    try {
      const spec = await fetchOpenAPISpec(apiUrl);
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
      const result = await callEndpoint(apiUrl, selectedMethod, selectedPath, data);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 max-w-[1400px]">
        <div className="flex items-center space-x-4 mb-8">
          <ServerIcon className="w-8 h-8" />
          <h1 className="text-3xl font-bold">FastAPI Client</h1>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex space-x-4">
            <Input
              placeholder="Enter FastAPI URL (e.g., http://localhost:8000)"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <Button onClick={loadSpec} disabled={loading}>
              {loading ? "Loading..." : "Load API"}
            </Button>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </Card>

        {spec && (
          <Tabs defaultValue="endpoints" className="space-y-4">
            <TabsList>
              <TabsTrigger value="endpoints">
                <SendIcon className="w-4 h-4 mr-2" />
                Endpoints
              </TabsTrigger>
              <TabsTrigger value="schema">
                <FileJson className="w-4 h-4 mr-2" />
                Schema
              </TabsTrigger>
            </TabsList>

            <TabsContent value="endpoints" className="space-y-4">
              <div className="grid grid-cols-[300px,1fr] gap-6">
                <div className="space-y-4">
                  {Object.entries(spec.paths).map(([path, pathItem]) => (
                    <Card key={path} className="p-4">
                      <h3 className="text-lg font-semibold mb-4">{path}</h3>
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

                <div>
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
            </TabsContent>

            <TabsContent value="schema">
              <Card className="p-6">
                <pre className="overflow-auto">
                  {JSON.stringify(spec, null, 2)}
                </pre>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}