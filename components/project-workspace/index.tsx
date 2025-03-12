"use client";

import { ProjectWorkspaceColumns } from './project-workspace-columns';
import { ProjectWorkspaceProvider } from './project-workspace-provider';

interface ProjectWorkspaceProps {
  onStepSelect: (step: string | null) => void;
}

export function ProjectWorkspace({ onStepSelect }: ProjectWorkspaceProps) {
  return (
    <ProjectWorkspaceProvider>
      <div className="bg-background rounded-lg shadow-lg border">
        <div className="px-8">
          <ProjectWorkspaceColumns onStepSelect={onStepSelect} />
        </div>
      </div>
    </ProjectWorkspaceProvider>
  );
}