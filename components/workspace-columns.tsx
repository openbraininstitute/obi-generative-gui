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

  const [levels, setLevels] = useState<ModelingItem[]>([
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

  const [stages, setStages] = useState<ModelingItem[]>([
    { title: 'Feeding Initiation', icon: <Brain className="w-6 h-6" /> },
    { title: 'Walking sideways', icon: <Activity className="w-6 h-6" /> },
    { title: 'Antena flex', icon: <Network className="w-6 h-6" /> }
  ]);

  const [stepTypes, setStepTypes] = useState<ModelingItem[]>([
    { title: 'Perform', icon: <Play className="w-6 h-6" /> },
    { title: 'Validate', icon: <Eye className="w-6 h-6" /> },
    { title: 'Predict', icon: <Activity className="w-6 h-6" /> }
  ]);

  const [steps, setSteps] = useState<ModelingItem[]>([
    { title: 'Excitatory neuron stimulation', icon: <Brain className="w-6 h-6" /> },
    { title: 'Inhibitory response', icon: <Activity className="w-6 h-6" /> },
    { title: 'Pattern generation', icon: <Network className="w-6 h-6" /> }
  ]);

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
    
    // Only reorder if dropping in the same list
    if (source.droppableId === destination.droppableId) {
      switch (source.droppableId) {
        case 'modelingLevels':
          setLevels(reorder(levels, source.index, destination.index));
          break;
        case 'stages':
          setStages(reorder(stages, source.index, destination.index));
          break;
        case 'stepTypes':
          setStepTypes(reorder(stepTypes, source.index, destination.index));
          break;
        case 'steps':
          setSteps(reorder(steps, source.index, destination.index));
          break;
      }
    }
  };

  const getFilteredItems = (items: ModelingItem[], selectedItem: string) => {
    return isCollapsed ? items.filter(item => item.title === selectedItem) : items;
  };

  const shouldShowAddButton = (type: 'level' | 'stage' | 'stepType' | 'step') => {
    if (!isCollapsed) return true;
    
    switch (type) {
      case 'level':
        return !selectedModelingLevel;
      case 'stage':
        return !selectedStage;
      case 'stepType':
        return !selectedStepType;
      case 'step':
        return !selectedStep;
      default:
        return false;
    }
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;
    // Add new item logic would go here
    setNewItemName('');
    setIsAddingTo(null);
  };

  const handleItemClick = (handler: () => void) => {
    setIsCollapsed(false);
    handler();
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
                        onClick={() => handleItemClick(() => onModelingLevelChange(item.title))}
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
                {getFilteredItems(stages, selectedStage).map((item, index) => (
                  <Draggable key={item.title} draggableId={item.title} index={index}>
                    {(provided) => (
                      <DraggableItem
                        item={item}
                        isSelected={item.title === selectedStage}
                        provided={provided}
                        onClick={() => handleItemClick(() => onStageChange(item.title))}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {shouldShowAddButton('stage') && (
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
                {getFilteredItems(stepTypes, selectedStepType).map((item, index) => (
                  <Draggable key={item.title} draggableId={item.title} index={index}>
                    {(provided) => (
                      <DraggableItem
                        item={item}
                        isSelected={item.title === selectedStepType}
                        provided={provided}
                        onClick={() => handleItemClick(() => onStepTypeChange(item.title))}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {shouldShowAddButton('stepType') && (
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
                {getFilteredItems(steps, selectedStep).map((item, index) => (
                  <Draggable key={item.title} draggableId={item.title} index={index}>
                    {(provided) => (
                      <DraggableItem
                        item={item}
                        isSelected={item.title === selectedStep}
                        provided={provided}
                        onClick={() => handleItemClick(() => onStepChange(item.title))}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {shouldShowAddButton('step') && (
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