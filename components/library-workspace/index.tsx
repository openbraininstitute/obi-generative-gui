"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Artifact {
  id: string;
  name: string;
  type: string;
  description: string;
  created: string;
  status: "completed" | "in_progress" | "failed";
}

const artifacts: Artifact[] = [
  {
    id: "1",
    name: "Pyramidal Cell L5",
    type: "ReconstructionMorphology",
    description: "Detailed morphological reconstruction of layer 5 pyramidal cell",
    created: "2025-03-15",
    status: "completed"
  },
  {
    id: "2",
    name: "Basket Cell",
    type: "ReconstructionMorphology",
    description: "Morphological reconstruction of inhibitory basket cell",
    created: "2025-03-14",
    status: "completed"
  },
  {
    id: "3",
    name: "Circuit Activity Analysis",
    type: "SimulationCampaign",
    description: "Parameter exploration of circuit response to stimulation",
    created: "2025-03-13",
    status: "in_progress"
  },
  {
    id: "4",
    name: "Local Circuit",
    type: "Circuit",
    description: "Local circuit configuration with 1000 neurons",
    created: "2025-03-12",
    status: "completed"
  }
];

export function LibraryWorkspace() {
  const [selectedTab, setSelectedTab] = useState("all");

  const filteredArtifacts = selectedTab === "all" 
    ? artifacts 
    : artifacts.filter(a => a.type === selectedTab);

  return (
    <div className={cn(
      "h-[calc(100%-3rem)] bg-background rounded-lg shadow-2xl border-2 border-blue-200/30 dark:border-gray-700 mx-6 mt-6"
    )}>
      <div className="border-b border-blue-900/30 mb-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ReconstructionMorphology">Morphologies</TabsTrigger>
            <TabsTrigger value="SimulationCampaign">Simulations</TabsTrigger>
            <TabsTrigger value="Circuit">Circuits</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="h-[calc(100%-4rem)] p-6">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArtifacts.map((artifact) => (
                <TableRow key={artifact.id}>
                  <TableCell className="font-medium">{artifact.name}</TableCell>
                  <TableCell>{artifact.type}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{artifact.description}</TableCell>
                  <TableCell>{artifact.created}</TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      artifact.status === "completed" && "bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400",
                      artifact.status === "in_progress" && "bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400",
                      artifact.status === "failed" && "bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400"
                    )}>
                      {artifact.status.replace("_", " ")}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}