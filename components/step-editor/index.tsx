"use client";

import { useState, useEffect } from "react";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { StepEditorForm } from "./step-editor-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, Plus, LayoutTemplate, Settings, FileBox, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

interface Task {
  id: string;
  name: string;
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
  const [editorOnRight, setEditorOnRight] = useState(false);
  const [selectedTab, setSelectedTab] = useState("configure");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({
    'Method.tex': `\\section{Neuron Stimulation Protocol}

\\subsection{Experimental Setup}
The stimulation protocol follows a precise temporal pattern:

\\[
V(t) = V_0 + A \\cdot \\sin(2\\pi f t)
\\]

where:
\\begin{align*}
V_0 &= \\text{baseline voltage (-70mV)} \\\\
A &= \\text{amplitude (20mV)} \\\\
f &= \\text{frequency (50Hz)}
\\end{align*}

\\subsection{Response Analysis}
The neuronal response is characterized by the firing rate:

\\[
r(t) = \\frac{n(t)}{\\Delta t}
\\]

where $n(t)$ represents spike count in time window $\\Delta t$.`,
    'Rational.tex': `\\section{Theoretical Framework}

The membrane potential dynamics follow the Hodgkin-Huxley model:

\\[
C_m \\frac{dV}{dt} = -\\sum_i g_i(V - E_i) + I_{ext}
\\]

where:
\\begin{align*}
C_m &= \\text{membrane capacitance} \\\\
g_i &= \\text{ionic conductances} \\\\
E_i &= \\text{reversal potentials} \\\\
I_{ext} &= \\text{external current}
\\end{align*}`,
    'ResultsSummary.tex': `\\section{Key Findings}

\\subsection{Spike Timing}
The interspike interval (ISI) distribution follows:

\\[
P(\\text{ISI}) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(\\text{ISI}-\\mu)^2}{2\\sigma^2}}
\\]

\\subsection{Network Effects}
The correlation between neurons $i$ and $j$:

\\[
C_{ij} = \\frac{\\langle (r_i - \\bar{r_i})(r_j - \\bar{r_j}) \\rangle}{\\sigma_i \\sigma_j}
\\]`
  });

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
      
      // Check if data has the forms property and it's an array
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
      .slice(1) // Remove leading slash
      .replace(/form$/, '') // Remove 'form' suffix
      .split(/(?=[A-Z])/) // Split on capital letters
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
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
            {selectedTab !== "description" && (
              <div className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                <Switch
                  checked={editorOnRight}
                  onCheckedChange={setEditorOnRight}
                  size="sm"
                />
              </div>
            )}

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
        {spec && selectedOperation && schema && (
          <StepEditorForm 
            schema={schema} 
            spec={spec} 
            onSubmit={handleSubmit}
            editorOnRight={editorOnRight}
            selectedTab={selectedTab}
            description={files['Method.tex']}
            onDescriptionChange={(content) => handleFileChange('Method.tex', content)}
            selectedFile={selectedFile}
            files={files}
            onFileSelect={setSelectedFile}
            onFileChange={handleFileChange}
          />
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