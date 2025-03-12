"use client";

import { useState, useEffect } from "react";
import { fetchOpenAPISpec, getSchemaFromPath, callEndpoint } from "@/lib/api-client";
import { StepEditorForm } from "./step-editor-form";
import { OpenAPIV3 } from "openapi-types";
import { AlertCircle, Plus, LayoutTemplate } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const API_URL = "http://127.0.0.1:8000";

interface Task {
  id: string;
  name: string;
}

export function StepEditor() {
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Task 1' },
    { id: '2', name: 'Task 2' },
    { id: '3', name: 'Task 3' }
  ]);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [editorOnRight, setEditorOnRight] = useState(false);

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

          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            <Switch
              checked={editorOnRight}
              onCheckedChange={setEditorOnRight}
              size="sm"
            />
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