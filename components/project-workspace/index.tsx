"use client";

import { ProjectWorkspaceColumns } from './project-workspace-columns';
import { ProjectWorkspaceProvider } from './project-workspace-provider';

export function ProjectWorkspace() {
  return (
    <ProjectWorkspaceProvider>
      <div className="h-full">
        <div className="px-8">
          <ProjectWorkspaceColumns />
        </div>
      </div>
    </ProjectWorkspaceProvider>
  );
}