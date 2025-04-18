"use client";

import { BlockType } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BlockTypeSelectorProps {
  blockTypes: BlockType[];
  onSelect: (blockType: BlockType) => void;
}

export function BlockTypeSelector({ blockTypes, onSelect }: BlockTypeSelectorProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>Block Type</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blockTypes.map((blockType, index) => (
              <TableRow
                key={index}
                className="cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => onSelect(blockType)}
              >
                <TableCell className="font-medium group-hover:text-primary">
                  {blockType.title.replace(/([A-Z])/g, ' $1').trim()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {blockType.description}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}