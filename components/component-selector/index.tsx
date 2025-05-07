"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Edit2 } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button"; 
import { fetchOpenAPISpec } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface ComponentSelectorProps {
  className?: string;
  selectedComponents: Array<{ path: string; name: string }>;
  activeComponent: string | null;
  onComponentSelect: (path: string) => void;
  onComponentRemove: (path: string) => void;
  onActiveComponentChange: (path: string | null) => void;
  onComponentRename: (path: string, newName: string) => void;
  onAddComponentClick: () => void;
  API_URL: string;
  spec: OpenAPIV3.Document | null;
}

interface EndpointInfo {
  path: string;
  summary: string;
  description: string;
}

export function ComponentSelector({
  className,
  selectedComponents,
  activeComponent,
  onComponentSelect,
  onComponentRemove,
  onActiveComponentChange,
  onComponentRename,
  onAddComponentClick,
  API_URL,
  spec
}: ComponentSelectorProps) {
  const [availableEndpoints, setAvailableEndpoints] = useState<EndpointInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [isComponentTableVisible, setIsComponentTableVisible] = useState(false);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    if (spec) {
      const endpoints = Object.entries(spec.paths)
        .filter(([_, pathItem]) => {
          const postOperation = (pathItem as OpenAPIV3.PathItemObject).post as OpenAPIV3.OperationObject;
          return postOperation?.tags?.includes('generated');
        })
        .map(([path, pathItem]) => {
          const postOperation = (pathItem as OpenAPIV3.PathItemObject).post as OpenAPIV3.OperationObject;
          return {
            path,
            summary: postOperation.summary || 'No summary available',
            description: postOperation.description || 'No description available'
          };
        });
      setAvailableEndpoints(endpoints);
      setError(null);
    }
  }, [API_URL]);

  useEffect(() => {
    if (!isAddingComponent) {
      setIsComponentTableVisible(false);
    } else {
      // Small delay to ensure smooth transition
      setTimeout(() => setIsComponentTableVisible(true), 50);
    }
  }, [isAddingComponent]);

  return (
    <div className={cn("bg-transparent", className)}>
      {/* Selected Components Header */}
      <div className="px-8 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          {selectedComponents.map(({ path, name }) => (
            <Button
              key={path}
              variant="outline"
              size="sm"
              className={cn(
                "flex items-center gap-2 group relative pr-8 flex-shrink-0 h-14",
                activeComponent === path 
                  ? !isAddingComponent 
                    ? "bg-background text-[#002766] dark:text-white border border-blue-200/30 dark:border-gray-700"
                    : "bg-transparent border border-[#40A9FF] text-white hover:bg-blue-800/30 dark:hover:bg-black/30"
                  : "bg-transparent border border-[#40A9FF] text-white hover:bg-blue-800/30 dark:hover:bg-black/30"
              )}
              onClick={() => {
                if (editingComponent !== path) {
                  onActiveComponentChange(isAddingComponent ? null : path);
                  setIsAddingComponent(false);
                }
              }}
            >
              {editingComponent === path ? (
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onComponentRename(path, editedName);
                      setEditingComponent(null);
                    } else if (e.key === 'Escape') {
                      setEditingComponent(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none focus:outline-none min-w-[50px] w-full"
                  autoFocus
                  style={{ width: `${editedName.length}ch` }}
                />
              ) : (
                <div className="bg-transparent">
                  <span 
                    className="flex flex-col items-start"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingComponent(path);
                      setEditedName(name);
                    }}
                  >
                    <span className={cn(
                      "text-base font-medium",
                      activeComponent === path && !isAddingComponent ? "text-[#002766] dark:text-white" : "text-white"
                    )}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{name}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{availableEndpoints.find(e => e.path === path)?.summary}</p>
                            <p className="text-sm text-muted-foreground mt-1">{availableEndpoints.find(e => e.path === path)?.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingComponent(path);
                        setEditedName(name);
                      }}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                    </button>
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComponentRemove(path);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80 transition-colors" />
                    </button>
                  </div>
                </div>
              )}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-shrink-0 h-14 text-base",
              isAddingComponent
                ? "bg-background text-[#002766] dark:text-white border border-blue-200/30 dark:border-gray-700"
                : "bg-transparent border border-[#40A9FF] text-white hover:bg-blue-800/30 dark:hover:bg-black/30"
            )}
            onClick={() => {
              setIsAddingComponent(prev => !prev);
              onAddComponentClick();
            }}
          >
            Add component +
          </Button>
          {error && (
            <Alert variant="destructive" className="ml-4 flex-shrink-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Components Table */}
      {isComponentTableVisible && (
        <div className="px-8 py-2 w-1/3">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground bg-background rounded-lg">
              Loading available components...
            </div>
          ) : (
            <div className="divide-y bg-background rounded-lg">
              {availableEndpoints.length > 0 ? availableEndpoints.map((path) => (
                <button
                  key={path.path}
                  className="flex items-start gap-2 py-2 w-full hover:bg-muted/50 transition-colors text-left group text-foreground px-3"
                  onClick={() => {
                    onComponentSelect(path.path);
                    onActiveComponentChange(path.path);
                    setIsAddingComponent(false);
                    setIsComponentTableVisible(false);
                  }}
                >
                  <div className="flex-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="font-medium">{path.summary}</h3>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{path.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </button>
              )) : (
                <div className="text-center text-muted-foreground py-4 px-3">
                  No components available. Please check your connection to the API server.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}