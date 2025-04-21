"use client";

import { useState, useEffect } from "react";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { StepEditorForm } from "./step-editor-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, Plus, LayoutTemplate, Settings, FileBox, FileText, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface Task {
  id: string;
  name: string;
}

interface BlockType {
  title: string;
  description: string;
}

export function StepEditor({ API_URL }: { API_URL: string }) {
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Task 1' },
    { id: '2', name: 'Task 2' },
    { id: '3', name: 'Task 3' }
  ]);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [selectedTab, setSelectedTab] = useState("configure");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [addingBlockSection, setAddingBlockSection] = useState<string>("");
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [files, setFiles] = useState<Record<string, string>>(latexExamples);

  useEffect(() => {
    loadSpec();
    fetchAvailableEndpoints();
  }, []);

  useEffect(() => {
    if (selectedTab === "description" && !selectedFile) {
      setSelectedFile('Method.tex');
    }
  }, [selectedTab]);

  const fetchAvailableEndpoints = async () => {
    try {
      const response = await fetch(`${API_URL}/forms`);
      if (!response.ok) {
        throw new Error('Failed to fetch available endpoints');
      }
      const data = await response.json();
      
      if (data && Array.isArray(data.forms)) {
        const formattedEndpoints = data.forms.map((endpoint: string) => `/${endpoint}`);
        setAvailableEndpoints(formattedEndpoints);
      } else {
        setError('Invalid response format from /forms endpoint');
        setAvailableEndpoints([]);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch available endpoints');
      setAvailableEndpoints([]);
    }
  };

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

  const handleCreateTask = () => {
    if (!newTaskName.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: newTaskName
    };

    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask.id);
    setNewTaskName("");
    setIsNewTaskDialogOpen(false);
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

  const selectedOperation = spec && selectedPath && selectedMethod
    ? (spec.paths[selectedPath]?.[selectedMethod.toLowerCase()] as OpenAPIV3.OperationObject)
    : null;

  const schema = spec && selectedPath && selectedMethod
    ? getSchemaFromPath(spec, selectedPath, selectedMethod)
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
      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Label>Lab:</Label>
            <div className="w-[240px]">
              <Select
                value={selectedPath}
                onValueChange={(path) => {
                  setSelectedPath(path);
                  setSelectedMethod('post');
                  setResponse(null);
                  setError(null);
                  setIsAddingBlock(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lab" />
                </SelectTrigger>
                <SelectContent>
                  {availableEndpoints.map((path) => (
                    <SelectItem key={path} value={path}>
                      {getEndpointDisplayName(path)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-[240px]">
              <Select
                value={selectedTask}
                onValueChange={setSelectedTask}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
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
              onClick={() => setIsNewTaskDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-[300px]">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="configure" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configure
                </TabsTrigger>
                <TabsTrigger value="artifacts" className="flex items-center gap-2">
                  <FileBox className="h-4 w-4" />
                  Artifacts
                </TabsTrigger>
                <TabsTrigger value="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </TabsTrigger>
              </TabsList>
            </Tabs>
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

      <div className="flex-1">
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
              onSubmit={handleSubmit}
              selectedTab={selectedTab}
              description={files['Method.tex']}
              onDescriptionChange={(content) => handleFileChange('Method.tex', content)}
              selectedFile={selectedFile}
              files={files}
              onFileSelect={setSelectedFile}
              onFileChange={handleFileChange}
              isAddingBlock={isAddingBlock}
            />
          )
        )}
      </div>

      <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}