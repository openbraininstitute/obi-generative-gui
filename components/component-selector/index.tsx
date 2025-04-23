"use client";

import { useState, useEffect } from "react";
import { Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentSelectorProps {
  className?: string;
  selectedComponents: Array<{ path: string; name: string }>;
  activeComponent: string | null;
  onComponentSelect: (path: string) => void;
  onComponentRemove: (path: string) => void;
  onActiveComponentChange: (path: string) => void;
  onComponentRename: (path: string, newName: string) => void;
  API_URL: string;
}

export function ComponentSelector({
  className,
  selectedComponents,
  activeComponent,
  onComponentSelect,
  onComponentRemove,
  onActiveComponentChange,
  onComponentRename,
  API_URL
}: ComponentSelectorProps) {
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddingComponent, setIsAddingComponent] = useState(false);
  const [editingComponent, setEditingComponent] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    fetchAvailableEndpoints();
  }, []);

  const fetchAvailableEndpoints = async () => {
    try {
      setLoading(true);
      setError(null);
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
    } finally {
      setLoading(false);
    }
  };

  const getEndpointDisplayName = (path: string) => {
    return path
      .slice(1)
      .replace(/Form$/, '')
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className={cn("bg-transparent rounded-lg border border-[#40A9FF] mx-8", className)}>
      {/* Selected Components Header */}
      <div className="px-4 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          {selectedComponents.map(({ path, name }) => (
            <Button
              key={path}
              variant={activeComponent === path ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2 group relative pr-8 flex-shrink-0 h-14"
              onClick={() => {
                if (editingComponent !== path) {
                  onActiveComponentChange(path);
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
                  className="bg-transparent border-none focus:outline-none w-24"
                  autoFocus
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
                    <span className="text-base font-medium">{name}</span>
                    <span className="text-sm text-muted-foreground">
                      {getEndpointDisplayName(path)}
                    </span>
                  </span>
                  <div className="absolute right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingComponent(path);
                        setEditedName(name);
                      }}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </button>
                    <button
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComponentRemove(path);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                    </button>
                  </div>
                </div>
              )}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-14 text-base"
            onClick={() => setIsAddingComponent(true)}
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
      {isAddingComponent && (
        <div className="p-3">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground bg-transparent">
              Loading available components...
            </div>
          ) : (
            <div className="divide-y">
              {availableEndpoints.length > 0 ? availableEndpoints.map((path) => (
                <button
                  key={path}
                  className="flex items-start gap-2 py-2 px-3 w-full hover:bg-muted/50 transition-colors text-left group bg-transparent"
                  onClick={() => {
                    onComponentSelect(path);
                    onActiveComponentChange(path);
                    setIsAddingComponent(false);
                  }}
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{getEndpointDisplayName(path)}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Form component for {getEndpointDisplayName(path).toLowerCase()}
                    </p>
                  </div>
                </button>
              )) : (
                <div className="text-center text-muted-foreground py-4 bg-transparent">
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