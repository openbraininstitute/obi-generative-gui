"use client";

import { useState, useEffect } from 'react';
import { Brain, Zap, Network, Activity, FlaskRound as Flask, Play, Box, Eye } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ModelingItem, WorkspaceColumnsProps } from '@/types/workspace';
import { ColumnHeader, AddButton, DraggableItem } from './workspace-column-styles';

export function WorkspaceColumns({
  selectedModelingLevel,
  selectedStage,
  selectedStepType,
  selectedStep,
  onModelingLevelChange,
  onStageChange,
  onStepTypeChange,
  onStepChange
}: WorkspaceColumnsProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAddingTo, setIsAddingTo] = useState<'level' | 'stage' | 'stepType' | 'step' | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Define hierarchical relationships
  const levelToStages: Record<string, ModelingItem[]> = {
    'Circuit Activity': [
      { title: 'Feeding Initiation', icon: <Brain className="w-6 h-6" /> },
      { title: 'Walking sideways', icon: <Activity className="w-6 h-6" /> },
      { title: 'Antena flex', icon: <Network className="w-6 h-6" /> }
    ],
    'Circuit': [
      { title: 'Signal Processing', icon: <Network className="w-6 h-6" /> },
      { title: 'Pattern Formation', icon: <Activity className="w-6 h-6" /> }
    ],
    'Neuron Physiology': [
      { title: 'Action Potential', icon: <Zap className="w-6 h-6" /> },
      { title: 'Membrane Dynamics', icon: <Activity className="w-6 h-6" /> }
    ]
  };

  const stageToStepTypes: Record<string, ModelingItem[]> = {
    'Feeding Initiation': [
      { title: 'Perform', icon: <Play className="w-6 h-6" /> },
      { title: 'Validate', icon: <Eye className="w-6 h-6" /> },
      { title: 'Predict', icon: <Activity className="w-6 h-6" /> }
    ],
    'Walking sideways': [
      { title: 'Simulate', icon: <Play className="w-6 h-6" /> },
      { title: 'Analyze', icon: <Eye className="w-6 h-6" /> }
    ]
  };

  const stepTypeToSteps: Record<string, ModelingItem[]> = {
    'Perform': [
      { title: 'Excitatory neuron stimulation', icon: <Brain className="w-6 h-6" /> },
      { title: 'Inhibitory response', icon: <Activity className="w-6 h-6" /> },
      { title: 'Pattern generation', icon: <Network className="w-6 h-6" /> }
    ],
    'Validate': [
      { title: 'Compare with experimental data', icon: <Activity className="w-6 h-6" /> },
      { title: 'Statistical analysis', icon: <Network className="w-6 h-6" /> }
    ]
  };

  const [levels] = useState<ModelingItem[]>([
    { title: 'Atlas', icon: <Brain className="w-6 h-6" /> },
    { title: 'Ion Channels', icon: <Zap className="w-6 h-6" /> },
    { title: 'Neuron morphologies', icon: <Network className="w-6 h-6" /> },
    { title: 'Neuron placement', icon: <Box className="w-6 h-6" /> },
    { title: 'Connectivity', icon: <Activity className="w-6 h-6" /> },
    { title: 'Neuron Physiology', icon: <Flask className="w-6 h-6" /> },
    { title: 'Synaptic Physiology', icon: <Network className="w-6 h-6" /> },
    { title: 'Circuit', icon: <Network className="w-6 h-6" /> },
    { title: 'Circuit Activity', icon: <Activity className="w-6 h-6" /> }
  ]);

  // Get available items based on parent selection
  const getAvailableStages = () => levelToStages[selectedModelingLevel] || [];
  const getAvailableStepTypes = () => stageToStepTypes[selectedStage] || [];
  const getAvailableSteps = () => stepTypeToSteps[selectedStepType] || [];

  useEffect(() => {
    if (selectedStep) {
      setIsCollapsed(true);
    }
  }, [selectedStep]);

  useEffect(() => {
    if (isAddingTo) {
      setIsCollapsed(false);
    }
  }, [isAddingTo]);

  const reorder = <T extends unknown>(list: T[], startIndex: number, endIndex: number): T[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Handle reordering within columns
      // Note: We're not updating the state here since we're using fixed hierarchical data
    }
  };

  const handleModelingLevelChange = (level: string) => {
    onModelingLevelChange(level);
    // Clear child selections when parent changes
    onStageChange('');
    onStepTypeChange('');
    onStepChange('');
    setIsCollapsed(false);
  };

  const handleStageChange = (stage: string) => {
    // Find corresponding modeling level if not already selected
    if (!selectedModelingLevel) {
      for (const [level, stages] of Object.entries(levelToStages)) {
        if (stages.some(s => s.title === stage)) {
          onModelingLevelChange(level);
          break;
        }
      }
    }
    onStageChange(stage);
    onStepTypeChange('');
    onStepChange('');
    setIsCollapsed(false);
  };

  const handleStepTypeChange = (type: string) => {
    // Find corresponding stage and level if not already selected
    if (!selectedStage) {
      for (const [stage, types] of Object.entries(stageToStepTypes)) {
        if (types.some(t => t.title === type)) {
          handleStageChange(stage);
          break;
        }
      }
    }
    onStepTypeChange(type);
    onStepChange('');
    setIsCollapsed(false);
  };

  const handleStepChange = (step: string) => {
    // Find corresponding step type, stage, and level if not already selected
    if (!selectedStepType) {
      for (const [type, steps] of Object.entries(stepTypeToSteps)) {
        if (steps.some(s => s.title === step)) {
          handleStepTypeChange(type);
          break;
        }
      }
    }
    onStepChange(step);
    setIsCollapsed(true);
  };

  const getFilteredItems = (items: ModelingItem[], selectedItem: string) => {
    return isCollapsed ? items.filter(item => item.title === selectedItem) : items;
  };

  const shouldShowAddButton = (type: 'level' | 'stage' | 'stepType' | 'step') => {
    if (isCollapsed) {
      switch (type) {
        case 'level':
          return !selectedModelingLevel;
        case 'stage':
          return selectedModelingLevel && !selectedStage;
        case 'stepType':
          return selectedStage && !selectedStepType;
        case 'step':
          return selectedStepType && !selectedStep;
        default:
          return false;
      }
    }
    return true;
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    setNewItemName('');
    setIsAddingTo(null);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4 p-4">
        <div className="space-y-2">
          <ColumnHeader title="STAGE" />
          <Droppable droppableId="modelingLevels">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {getFilteredItems(levels, selectedModelingLevel).map((item, index) => (
                  <Draggable key={item.title} draggableId={item.title} index={index}>
                    {(provided) => (
                      <DraggableItem
                        item={item}
                        isSelected={item.title === selectedModelingLevel}
                        provided={provided}
                        onClick={() => handleModelingLevelChange(item.title)}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {shouldShowAddButton('level') && (
            <AddButton
              type="level"
              isAddingTo={isAddingTo}
              newItemName={newItemName}
              onNameChange={setNewItemName}
              onAdd={handleAddNewItem}
              onCancel={() => setIsAddingTo(null)}
              onClick={() => setIsAddingTo('level')}
            />
          )}
        </div>

        <div className="space-y-2">
          <ColumnHeader title="SUB-STAGE" />
          <Droppable droppableId="stages">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {getFilteredItems(getAvailableStages(), selectedStage).map((item, index) => (
                  <Draggable key={item.title} draggableId={item.title} index={index}>
                    {(provided) => (
                      <DraggableItem
                        item={item}
                        isSelected={item.title === selectedStage}
                        provided={provided}
                        onClick={() => handleStageChange(item.title)}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {shouldShowAddButton('stage') && selectedModelingLevel && (
            <AddButton
              type="stage"
              isAddingTo={isAddingTo}
              newItemName={newItemName}
              onNameChange={setNewItemName}
              onAdd={handleAddNewItem}
              onCancel={() => setIsAddingTo(null)}
              onClick={() => setIsAddingTo('stage')}
            />
          )}
        </div>

        <div className="space-y-2">
          <ColumnHeader title="STEP-TYPE" />
          <Droppable droppableId="stepTypes">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {getFilteredItems(getAvailableStepTypes(), selectedStepType).map((item, index) => (
                  <Draggable key={item.title} draggableId={item.title} index={index}>
                    {(provided) => (
                      <DraggableItem
                        item={item}
                        isSelected={item.title === selectedStepType}
                        provided={provided}
                        onClick={() => handleStepTypeChange(item.title)}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {shouldShowAddButton('stepType') && selectedStage && (
            <AddButton
              type="stepType"
              isAddingTo={isAddingTo}
              newItemName={newItemName}
              onNameChange={setNewItemName}
              onAdd={handleAddNewItem}
              onCancel={() => setIsAddingTo(null)}
              onClick={() => setIsAddingTo('stepType')}
            />
          )}
        </div>

        <div className="space-y-2">
          <ColumnHeader title="STEP" />
          <Droppable droppableId="steps">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {getFilteredItems(getAvailableSteps(), selectedStep).map((item, index) => (
                  <Draggable key={item.title} draggableId={item.title} index={index}>
                    {(provided) => (
                      <DraggableItem
                        item={item}
                        isSelected={item.title === selectedStep}
                        provided={provided}
                        onClick={() => handleStepChange(item.title)}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {shouldShowAddButton('step') && selectedStepType && (
            <AddButton
              type="step"
              isAddingTo={isAddingTo}
              newItemName={newItemName}
              onNameChange={setNewItemName}
              onAdd={handleAddNewItem}
              onCancel={() => setIsAddingTo(null)}
              onClick={() => setIsAddingTo('step')}
            />
          )}
        </div>
      </div>
    </DragDropContext>
  );
}