"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface FromIDSelectorProps {
  type: string;
  value: string | null;
  onChange: (value: string) => void;
}

export function FromIDSelector({ type, value, onChange }: FromIDSelectorProps) {
  const items = [
    { id: 'A', name: `${type} A`, description: `Description of ${type} A` },
    { id: 'B', name: `${type} B`, description: `Description of ${type} B` },
    { id: 'C', name: `${type} C`, description: `Description of ${type} C` },
  ];

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Select {type}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>
                {value === item.id ? (
                  <Button variant="ghost" size="sm" className="w-[60px]" disabled>
                    <Check className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-[60px]"
                    onClick={() => onChange(item.id)}
                  >
                    Select
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}