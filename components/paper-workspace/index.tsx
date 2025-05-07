"use client";

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaperWorkspaceColumns } from './paper-workspace-columns';
import { PaperWorkspaceProvider } from './paper-workspace-provider';
import { cn } from '@/lib/utils';

interface PaperWorkspaceProps {
  onSectionSelect: (section: string | null) => void;
}

export function PaperWorkspace({ onSectionSelect }: PaperWorkspaceProps) {
  const [selectedTab, setSelectedTab] = useState("descriptions");

  return (
    <PaperWorkspaceProvider>
      <div className={cn(
        "h-[calc(100%-3rem)] bg-background rounded-lg shadow-2xl border-2 border-blue-200/30 dark:border-gray-700 mx-6 mt-6"
      )}>
        <div className="border-b border-blue-900/30 mb-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="descriptions">Descriptions</TabsTrigger>
              <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="notebooks">Notebooks</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="h-[calc(100%-4rem)] p-6">
          <PaperWorkspaceColumns onSectionSelect={onSectionSelect} />
        </div>
      </div>
    </PaperWorkspaceProvider>
  );
}