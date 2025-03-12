"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { ModelingItem } from './types';

interface ProjectWorkspaceContextType {
  selectedModelingLevel: string;
  selectedStage: string;
  selectedStepType: string;
  selectedStep: string;
  setSelectedModelingLevel: (level: string) => void;
  setSelectedStage: (stage: string) => void;
  setSelectedStepType: (type: string) => void;
  setSelectedStep: (step: string) => void;
}

const ProjectWorkspaceContext = createContext<ProjectWorkspaceContextType | undefined>(undefined);

export function ProjectWorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedModelingLevel, setSelectedModelingLevel] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedStepType, setSelectedStepType] = useState('');
  const [selectedStep, setSelectedStep] = useState('');

  return (
    <ProjectWorkspaceContext.Provider
      value={{
        selectedModelingLevel,
        selectedStage,
        selectedStepType,
        selectedStep,
        setSelectedModelingLevel,
        setSelectedStage,
        setSelectedStepType,
        setSelectedStep,
      }}
    >
      {children}
    </ProjectWorkspaceContext.Provider>
  );
}

export function useProjectWorkspace() {
  const context = useContext(ProjectWorkspaceContext);
  if (context === undefined) {
    throw new Error('useProjectWorkspace must be used within a ProjectWorkspaceProvider');
  }
  return context;
}