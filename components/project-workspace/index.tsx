"use client";

import { ProjectWorkspaceHeader } from './project-workspace-header';
import { ProjectWorkspaceColumns } from './project-workspace-columns';
import { ProjectWorkspaceProvider } from './project-workspace-provider';

export function ProjectWorkspace() {
  return (
    <ProjectWorkspaceProvider>
      <div className="bg-[#002766] text-white">
        <ProjectWorkspaceHeader />
        <div className="px-8">
          <ProjectWorkspaceColumns />
        </div>
      </div>
    </ProjectWorkspaceProvider>
  );
}