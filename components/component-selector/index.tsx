"use client";

import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ComponentSelectorProps {
  selectedComponents: string[];
  availableEndpoints: string[];
  onComponentSelect: (path: string) => void;
  onComponentRemove: (path: string) => void;
  spec: any;
}

export function ComponentSelector({
  selectedComponents,
  availableEndpoints,
  onComponentSelect,
  onComponentRemove,
  spec
}: ComponentSelectorProps) {
  const getEndpointDisplayName = (path: string) => {
    return path
      .slice(1)
      .replace(/form$/, '')
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="bg-background rounded-lg shadow-lg border-2 border-blue-200/30 dark:border-gray-700 mb-6">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {selectedComponents.map((path) => (
            <Button
              key={path}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => onComponentRemove(path)}
            >
              {getEndpointDisplayName(path)}
              <X className="h-4 w-4" />
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
          >
            Add component +
          </Button>
        </div>
      </div>
      {selectedComponents.length === 0 && (
        <div className="p-6">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold">Component</TableCell>
                <TableCell className="font-bold">Description</TableCell>
                <TableCell className="font-bold">Contributor</TableCell>
              </TableRow>
              {availableEndpoints.map((path) => (
                <TableRow
                  key={path}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onComponentSelect(path)}
                >
                  <TableCell className="font-medium">{getEndpointDisplayName(path)}</TableCell>
                  <TableCell>{spec?.paths[path]?.post?.description || 'No description available'}</TableCell>
                  <TableCell>Open Brain Institute</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}