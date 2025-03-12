"use client";

import { useState } from 'react';
import { Menu, Activity, Filter, ChevronDown } from 'lucide-react';
import { WorkspaceColumns } from './workspace-columns';
import { TaskNotebookPanel } from './task-notebook-panel';
import { ViewSelector } from './view-selector';

export function ModelingInterface() {
  const [selectedModelingLevel, setSelectedModelingLevel] = useState('Circuit Activity');
  const [selectedStage, setSelectedStage] = useState('Feeding Initiation');
  const [selectedStepType, setSelectedStepType] = useState('Perform');
  const [selectedStep, setSelectedStep] = useState('');
  const [showTasksTable, setShowTasksTable] = useState(true);
  const [selectedTaskType, setSelectedTaskType] = useState<'task' | 'notebook'>('task');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'all' | 'active' | 'completed'>('all');

  const handleModelingLevelChange = (level: string) => {
    setSelectedModelingLevel(level);
    const firstStage = level === 'Circuit Activity' ? 'Feeding Initiation' : '';
    setSelectedStage(firstStage);
    setSelectedStepType('');
    setSelectedStep('');
  };

  const handleStageChange = (stage: string) => {
    setSelectedStage(stage);
    setSelectedStepType('');
    setSelectedStep('');
  };

  const handleStepTypeChange = (type: string) => {
    setSelectedStepType(type);
    setSelectedStep('');
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTasksTable(false);
  };

  return (
    <div className="bg-[#002766] text-white">
      <header className="bg-[#002B69] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Menu className="w-6 h-6 cursor-pointer hover:text-blue-300 transition-colors" />
          <Activity className="w-6 h-6" />
        </div>
        <div className="flex items-center space-x-4">
          <Filter className="w-6 h-6 cursor-pointer hover:text-blue-300 transition-colors" />
          <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors">Build</button>
          <button className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700 transition-colors">01 Circuit</button>
          <button className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700 transition-colors">Validation</button>
          <span className="cursor-pointer hover:text-blue-300 transition-colors">View</span>
          <button className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center">
            WORKSPACE
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
        </div>
      </header>

      <WorkspaceColumns
        selectedModelingLevel={selectedModelingLevel}
        selectedStage={selectedStage}
        selectedStepType={selectedStepType}
        selectedStep={selectedStep}
        onModelingLevelChange={handleModelingLevelChange}
        onStageChange={handleStageChange}
        onStepTypeChange={handleStepTypeChange}
        onStepChange={setSelectedStep}
      />

      {selectedStep && (
        <div className="px-4 pb-4 flex gap-4">
          <TaskNotebookPanel
            selectedTaskType={selectedTaskType}
            selectedTaskId={selectedTaskId}
            showTasksTable={showTasksTable}
            onTaskTypeChange={setSelectedTaskType}
            onTaskSelect={handleTaskSelect}
            onToggleTasksTable={() => setShowTasksTable(!showTasksTable)}
          />
          <ViewSelector
            selectedView={selectedView}
            onViewChange={setSelectedView}
          />
        </div>
      )}
    </div>
  );
}