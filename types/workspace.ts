import { ReactNode } from 'react';

export interface ModelingItem {
  title: string;
  icon: ReactNode;
  subtitle?: string;
}

export interface WorkspaceColumnsProps {
  selectedModelingLevel: string;
  selectedStage: string;
  selectedStepType: string;
  selectedStep: string;
  onModelingLevelChange: (level: string) => void;
  onStageChange: (stage: string) => void;
  onStepTypeChange: (type: string) => void;
  onStepChange: (step: string) => void;
}