"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function ExploreWindow() {
  const data = [
    {
      type: "M-TYPES",
      name: "GEN_mtype",
      count: "2,808,000",
      description: "General excitatory neurons"
    },
    {
      type: "M-TYPES",
      name: "GIN_mtype",
      count: "2,879,000",
      description: "GABAergic inhibitory neurons"
    },
    {
      type: "M-TYPES",
      name: "VPL_IN",
      count: "127,500",
      description: "Ventral posterolateral interneurons"
    },
    {
      type: "M-TYPES",
      name: "Rt_RC",
      count: "62,280",
      description: "Reticular thalamic neurons"
    }
  ];

  return (
    <div className={cn(
      "h-[calc(100%-3rem)] bg-background rounded-lg shadow-2xl border-2 border-blue-200/30 dark:border-gray-700 mx-6 mt-6"
    )}>
      <div className="h-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Brain stem</h2>
            <p className="text-muted-foreground">~5,877,000 neurons</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Display:</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">count</span>
                <span className="text-sm font-medium text-muted-foreground">density</span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Neuron Types</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell className="text-muted-foreground">{item.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Morphology</h3>
                <div className="bg-muted/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>743 records</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Electrophysiology</h3>
                <div className="bg-muted/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>531 records</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Neuron density</h3>
                <div className="bg-muted/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>2 records</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Bouton density</h3>
                <div className="bg-muted/40 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span>0 record</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}