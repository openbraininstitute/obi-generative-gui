"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComponentSelectorProps {
  className?: string;
  selectedComponents: string[];
  activeComponent: string | null;
  onComponentSelect: (paths: string[]) => void;
  onComponentRemove: (path: string) => void;
  onActiveComponentChange: (path: string) => void;
  API_URL: string;
}

export function ComponentSelector({
  className,
  selectedComponents,
  activeComponent,
  onComponentSelect,
  onComponentRemove,
  onActiveComponentChange,
  API_URL
}: ComponentSelectorProps) {
  const [availableEndpoints, setAvailableEndpoints] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddingComponent, setIsAddingComponent] = useState(false);

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
    <div className={cn("bg-background rounded-lg shadow-lg border-2 border-blue-200/30 dark:border-gray-700 mx-8", className)}>
      {/* Selected Components Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {selectedComponents.map((path) => (
            <Button
              key={path}
              variant={activeComponent === path ? "default" : "outline"}
              size="sm"
              className="flex items-center gap-2 group relative pr-8 flex-shrink-0"
              onClick={() => onActiveComponentChange(path)}
            >
              {getEndpointDisplayName(path)}
              <div 
                className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onComponentRemove(path);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
              </div>
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
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
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading available components...
            </div>
          ) : (
            <div className="divide-y">
              {availableEndpoints.length > 0 ? availableEndpoints.map((path) => (
                <button
                  key={path}
                  className="flex items-start gap-4 p-4 w-full hover:bg-muted/50 transition-colors text-left group"
                  onClick={() => {
                    const newPaths = [...selectedComponents, path];
                    onComponentSelect(newPaths);
                    onActiveComponentChange(path);
                    setIsAddingComponent(false);
                  }}
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{getEndpointDisplayName(path)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Form component for {getEndpointDisplayName(path).toLowerCase()}
                    </p>
                  </div>
                </button>
              )) : (
                <div className="text-center text-muted-foreground py-8">
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