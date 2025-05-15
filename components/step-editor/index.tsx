"use client";

import { useState, useEffect } from "react";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { StepEditorForm } from "./step-editor-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, Plus, Settings, FileText, Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { latexExamples } from "@/lib/latex-examples";
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

interface BlockType {
  title: string;
  description: string;
}

export function StepEditor({ 
  API_URL,
  activeComponent,
  selectedComponents,
  isCNSMode
}: { 
  API_URL: string;
  activeComponent: string | null;
  selectedComponents: Array<{ path: string; name: string }>;
  isCNSMode: boolean;
}) {
  const [selectedTask, setSelectedTask] = useState<string>("1");
  const [tasks, setTasks] = useState([{ id: '1', name: '1' }]);
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("POST");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState("configure");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [addingBlockSection, setAddingBlockSection] = useState<string>("");
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [files, setFiles] = useState<Record<string, string>>(latexExamples);

  const handleAddVersion = () => {
    const nextVersion = tasks.length + 1;
    const newTask = { id: nextVersion.toString(), name: nextVersion.toString() };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask.id);
  };

  useEffect(() => {
    loadSpec();
  }, []);

  useEffect(() => {
    if (selectedTab === "description" && !selectedFile) {
      setSelectedFile('Method.tex');
    }
  }, [selectedTab]);

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
      const result = await callEndpoint(API_URL, selectedMethod, selectedComponents[0].path, data);
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

  const handleFileChange = (file: string, content: string) => {
    setFiles(prev => ({
      ...prev,
      [file]: content
    }));
  };

  const getEndpointDisplayName = (path: string) => {
    return path
      .slice(1)
      .replace(/form$/, '')
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleAddBlock = (section: string) => {
    if (!spec) return;
    
    const sectionSchema = resolveSchema(schema.properties?.[section] as OpenAPIV3.SchemaObject);
    if (!sectionSchema?.additionalProperties) return;

    const blockSchemas = sectionSchema.additionalProperties.anyOf || 
                        [sectionSchema.additionalProperties];
    
    const types = blockSchemas.map(schema => {
      const resolved = schema as OpenAPIV3.SchemaObject;
      return {
        title: resolved.title || resolved.const || 'Unnamed Block',
        description: resolved.description || 'No description available'
      };
    });

    setBlockTypes(types);
    setAddingBlockSection(section);
    setIsAddingBlock(true);
  };

  const selectedOperation = spec && activeComponent && selectedMethod
    ? (spec.paths[activeComponent]?.[selectedMethod.toLowerCase()] as OpenAPIV3.OperationObject)
    : null;

  const schema = spec && activeComponent && selectedMethod
    ? getSchemaFromPath(spec, activeComponent, selectedMethod)
    : null;

  if (loading && !spec) {
    return (
      <div className="bg-background rounded-lg shadow-lg border-2 border-blue-200/30 dark:border-gray-700 p-6 h-full">
        <p className="text-lg text-muted-foreground">Loading API specification...</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow-lg border-2 border-blue-200/30 dark:border-gray-700 h-full flex flex-col">
      {selectedComponents.length > 0 && (
        <>
          <div className="flex-none px-6 py-4 border-b space-y-4">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Version</Label>
                <div className="w-[48px]">
                  <Select
                    value={selectedTask}
                    onValueChange={setSelectedTask}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAddVersion}
                  className="hover:bg-muted h-7 w-7"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="ml-8">
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className={cn("grid w-full", isCNSMode ? "grid-cols-2" : "grid-cols-3")}>
                    <TabsTrigger value="configure">Configure</TabsTrigger>
                    <TabsTrigger value="artifacts">Coordinates</TabsTrigger>
                    {!isCNSMode && <TabsTrigger value="description">Description</TabsTrigger>}
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex-none px-6 py-4 border-b">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {isAddingBlock ? (
              <div className="grid grid-cols-[23.5%_auto] h-full">
                <div className="border-r">
                  <BlockList
                    sections={sections}
                    blocks={blocks}
                    selectedSection={selectedSection}
                    selectedBlock={selectedBlock}
                    onSectionSelect={(section, block) => {
                      setSelectedSection(section);
                      setSelectedBlock(block);
                    }}
                    onAddBlock={handleAddBlock}
                    onUpdateBlockName={handleUpdateBlockName}
                    onDeleteBlock={handleDeleteBlock}
                    onGenerate={handleSubmit(handleFormSubmit)}
                  />
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">Select Block Type</h2>
                    <p className="text-sm text-muted-foreground">Choose a block type to add to your workflow</p>
                  </div>
                  <div className="grid gap-4">
                    {blockTypes.map((blockType, index) => (
                      <button
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          setIsAddingBlock(false);
                          // Add your block creation logic here
                        }}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium">{blockType.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{blockType.description}</p>
                        </div>
                        <div className="flex-none">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              spec && selectedOperation && schema && (
                <StepEditorForm 
                  schema={schema} 
                  spec={spec} 
                  selectedMethod={selectedMethod}
                  onSubmit={handleSubmit}
                  selectedTab={selectedTab}
                  description={files['Method.tex']}
                  onDescriptionChange={(content) => handleFileChange('Method.tex', content)}
                  selectedFile={selectedFile}
                  files={files}
                  onFileSelect={setSelectedFile}
                  onFileChange={handleFileChange}
                  isAddingBlock={isAddingBlock}
                  activeComponent={activeComponent || selectedComponents[0]}
                  isCNSMode={isCNSMode}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}