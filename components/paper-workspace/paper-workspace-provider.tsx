"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface PaperWorkspaceContextType {
  selectedSection: string;
  selectedSubSection: string;
  selectedStepType: string;
  selectedStep: string;
  setSelectedSection: (section: string) => void;
  setSelectedSubSection: (subSection: string) => void;
  setSelectedStepType: (type: string) => void;
  setSelectedStep: (step: string) => void;
}

const PaperWorkspaceContext = createContext<PaperWorkspaceContextType | undefined>(undefined);

export function PaperWorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubSection, setSelectedSubSection] = useState('');
  const [selectedStepType, setSelectedStepType] = useState('');
  const [selectedStep, setSelectedStep] = useState('');

  return (
    <PaperWorkspaceContext.Provider
      value={{
        selectedSection,
        selectedSubSection,
        selectedStepType,
        selectedStep,
        setSelectedSection,
        setSelectedSubSection,
        setSelectedStepType,
        setSelectedStep,
      }}
    >
      {children}
    </PaperWorkspaceContext.Provider>
  );
}

export function usePaperWorkspace() {
  const context = useContext(PaperWorkspaceContext);
  if (context === undefined) {
    throw new Error('usePaperWorkspace must be used within a PaperWorkspaceProvider');
  }
  return context;
}