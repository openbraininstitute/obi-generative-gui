"use client";

import { useState, useEffect } from 'react';
import { Brain, Zap, Network, Activity, FlaskRound as Flask, Play, Box, Eye, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ModelingItem {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
}

interface WorkspaceColumnsProps {
  selectedModelingLevel: string;
  selectedStage: string;
  selectedStepType: string;
  selectedStep: string;
  onModelingLevelChange: (level: string) => void;
  onStageChange: (stage: string) => void;
  onStepTypeChange: (type: string) => void;
  onStepChange: (step: string) => void;
}

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
  const [isAddingTo, setIsAddingTo] = useState<'level' | 'stage' | 'stepType' | 'step' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [modelingLevels, setModelingLevels] = useState<ModelingItem[]>([
    { title: 'Atlas', icon: <Brain className="w-6 h-6" /> },
    { title: 'Ion Channels', icon: <Zap className="w-6 h-6" /> },
    { title: 'Neuron morphologies', icon: <Network className="w-6 h-6" /> },
    { title: 'Neuron placement', icon: <Box className="w-6 h-6" /> },
    { title: 'Connectivity', icon: <Activity className="w-6 h-6" /> },
    { title: 'Neuron Physiology', icon: <Flask className="w-6 h-6" /> },
    { title: 'Synaptic Physiology', icon: <Network className="w-6 h-6" /> },
    { title: 'Circuit', icon: <Network className="w-6 h-6" /> },
    { title: 'Circuit Activity', icon: <Activity className="w-6 h-6" />, subtitle: 'Circuit Activity Modeling Level' }
  ]);

  const [hierarchyData, setHierarchyData] = useState({
    'Circuit Activity': {
      stages: [
        { title: 'Feeding Initiation', icon: <Brain className="w-6 h-6" />, subtitle: 'Simulation Stage' },
        { title: 'Walking sideways', icon: <Activity className="w-6 h-6" /> },
        { title: 'Antena flex', icon: <Network className="w-6 h-6" /> }
      ],
      stepTypes: {
        'Feeding Initiation': {
          types: {
            'Perform': {
              steps: [
                { title: 'Excitatory neuron stimulation', icon: <Brain className="w-6 h-6" />, subtitle: 'Circuit Simulation' },
                { title: 'Inhibitory response', icon: <Activity className="w-6 h-6" />, subtitle: 'Neural Response' },
                { title: 'Pattern generation', icon: <Network className="w-6 h-6" />, subtitle: 'Circuit Pattern' }
              ]
            },
            'Validate': {
              steps: [
                { title: 'Validation step 1', icon: <Eye className="w-6 h-6" /> },
                { title: 'Validation step 2', icon: <Activity className="w-6 h-6" /> }
              ]
            },
            'Predict': {
              steps: [
                { title: 'Prediction step 1', icon: <Activity className="w-6 h-6" /> }
              ]
            }
          }
        }
      }
    }
  });

  useEffect(() => {
    if (isAddingTo) {
      setIsCollapsed(false);
    }
  }, [isAddingTo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCollapsed(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedModelingLevel, selectedStage, selectedStepType, selectedStep]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (result.source.droppableId === result.destination.droppableId) {
      switch (result.source.droppableId) {
        case 'modelingLevels':
          const newModelingLevels = Array.from(modelingLevels);
          const [removed] = newModelingLevels.splice(sourceIndex, 1);
          newModelingLevels.splice(destinationIndex, 0, removed);
          setModelingLevels(newModelingLevels);
          break;

        case 'stages':
          if (!selectedModelingLevel) return;
          const newHierarchyData = { ...hierarchyData };
          const stages = [...newHierarchyData[selectedModelingLevel].stages];
          const [removedStage] = stages.splice(sourceIndex, 1);
          stages.splice(destinationIndex, 0, removedStage);
          newHierarchyData[selectedModelingLevel].stages = stages;
          setHierarchyData(newHierarchyData);
          break;

        case 'stepTypes':
          if (!selectedModelingLevel || !selectedStage) return;
          const stepTypes = currentStepTypes;
          const [removedType] = stepTypes.splice(sourceIndex, 1);
          stepTypes.splice(destinationIndex, 0, removedType);
          
          const newTypes: { [key: string]: { steps: ModelingItem[] } } = {};
          stepTypes.forEach(type => {
            newTypes[type.title] = hierarchyData[selectedModelingLevel].stepTypes[selectedStage].types[type.title] || { steps: [] };
          });
          
          const updatedHierarchyData = { ...hierarchyData };
          updatedHierarchyData[selectedModelingLevel].stepTypes[selectedStage].types = newTypes;
          setHierarchyData(updatedHierarchyData);
          break;

        case 'steps':
          if (!selectedModelingLevel || !selectedStage || !selectedStepType) return;
          const newStepsData = { ...hierarchyData };
          const steps = [...newStepsData[selectedModelingLevel].stepTypes[selectedStage].types[selectedStepType].steps];
          const [removedStep] = steps.splice(sourceIndex, 1);
          steps.splice(destinationIndex, 0, removedStep);
          newStepsData[selectedModelingLevel].stepTypes[selectedStage].types[selectedStepType].steps = steps;
          setHierarchyData(newStepsData);
          break;
      }
    }
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) return;

    const newHierarchyData = { ...hierarchyData };

    switch (isAddingTo) {
      case 'level':
        const newLevel = {
          title: newItemName,
          icon: <Activity className="w-6 h-6" />
        };
        setModelingLevels([...modelingLevels, newLevel]);
        
        newHierarchyData[newItemName] = {
          stages: [],
          stepTypes: {}
        };
        setHierarchyData(newHierarchyData);
        
        onModelingLevelChange(newItemName);
        break;

      case 'stage':
        if (!selectedModelingLevel) return;
        const newStage = {
          title: newItemName,
          icon: <Activity className="w-6 h-6" />
        };
        
        if (!newHierarchyData[selectedModelingLevel]) {
          newHierarchyData[selectedModelingLevel] = {
            stages: [],
            stepTypes: {}
          };
        }
        
        newHierarchyData[selectedModelingLevel].stages.push(newStage);
        newHierarchyData[selectedModelingLevel].stepTypes[newItemName] = {
          types: {}
        };
        
        setHierarchyData(newHierarchyData);
        onStageChange(newItemName);
        break;

      case 'stepType':
        if (!selectedModelingLevel || !selectedStage) return;
        
        if (!newHierarchyData[selectedModelingLevel].stepTypes[selectedStage]) {
          newHierarchyData[selectedModelingLevel].stepTypes[selectedStage] = {
            types: {}
          };
        }
        
        newHierarchyData[selectedModelingLevel].stepTypes[selectedStage].types[newItemName] = {
          steps: []
        };
        
        setHierarchyData(newHierarchyData);
        onStepTypeChange(newItemName);
        break;

      case 'step':
        if (!selectedModelingLevel || !selectedStage || !selectedStepType) return;
        const newStep = {
          title: newItemName,
          icon: <Activity className="w-6 h-6" />
        };
        
        if (!newHierarchyData[selectedModelingLevel].stepTypes[selectedStage].types[selectedStepType]) {
          newHierarchyData[selectedModelingLevel].stepTypes[selectedStage].types[selectedStepType] = {
            steps: []
          };
        }
        
        newHierarchyData[selectedModelingLevel].stepTypes[selectedStage].types[selectedStepType].steps.push(newStep);
        setHierarchyData(newHierarchyData);
        onStepChange(newItemName);
        break;
    }

    setNewItemName('');
    setIsAddingTo(null);
  };

  const currentStages = hierarchyData[selectedModelingLevel]?.stages || [];
  const currentStepTypes = Object.keys(hierarchyData[selectedModelingLevel]?.stepTypes[selectedStage]?.types || {}).map(type => ({
    title: type,
    icon: type === 'Perform' ? <Play className="w-6 h-6" /> :
          type === 'Validate' ? <Eye className="w-6 h-6" /> :
          <Activity className="w-6 h-6" />,
    subtitle: type === 'Perform' ? 'Perform Step Type' : undefined
  }));
  const currentSteps = selectedStepType ? 
    (hierarchyData[selectedModelingLevel]?.stepTypes[selectedStage]?.types[selectedStepType]?.steps || []) : 
    [];

  const renderDraggableItem = (item: ModelingItem, index: number, isSelected: boolean, onClick: () => void) => (
    <Draggable key={item.title} draggableId={item.title} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 rounded cursor-pointer transition-all duration-300 mb-2 ${
            isSelected 
              ? 'bg-white text-[#002766]' 
              : 'bg-transparent border border-[#1890FF] text-white/70 hover:bg-blue-800/30'
          }`}
          onClick={onClick}
        >
          <div className="flex items-center space-x-3">
            <div className={isSelected ? 'text-[#002766]' : 'text-white/70'}>
              {item.icon}
            </div>
            <div>
              <div className="font-medium">{item.title}</div>
              {item.subtitle && (
                <div className={`text-sm ${isSelected ? 'text-[#002766]/70' : 'text-gray-400'}`}>
                  {item.subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

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

  const renderAddButton = (type: 'level' | 'stage' | 'stepType' | 'step', condition: boolean) => {
    if (!shouldShowAddButton(type)) return null;

    return condition && (
      isAddingTo === type ? (
        <div className="p-3 rounded bg-transparent border border-[#1890FF] flex items-center space-x-2 mt-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewItem()}
            className="flex-1 bg-blue-800/30 text-white rounded px-2 py-1"
            placeholder="Enter name..."
            autoFocus
          />
          <button 
            onClick={handleAddNewItem}
            className="text-white/70 hover:text-white"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingTo(type)}
          className="w-full p-3 rounded bg-transparent border border-[#1890FF] hover:bg-blue-800/30 flex items-center justify-center space-x-2 text-white/70 mt-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add {type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </button>
      )
    );
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4 p-4">
        <div className="space-y-2">
          <h2 className="text-sm text-gray-400 mb-4">MODELING LEVEL</h2>
          <Droppable droppableId="modelingLevels">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {getFilteredItems(modelingLevels, selectedModelingLevel).map((item, index) => 
                  renderDraggableItem(
                    item,
                    index,
                    item.title === selectedModelingLevel,
                    () => onModelingLevelChange(item.title)
                  )
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {renderAddButton('level', true)}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm text-gray-400 mb-4">STAGE</h2>
          <Droppable droppableId="stages">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {getFilteredItems(currentStages, selectedStage).map((item, index) =>
                  renderDraggableItem(
                    item,
                    index,
                    item.title === selectedStage,
                    () => onStageChange(item.title)
                  )
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {renderAddButton('stage', !!selectedModelingLevel)}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm text-gray-400 mb-4">STEP TYPE</h2>
          <Droppable droppableId="stepTypes">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {getFilteredItems(currentStepTypes, selectedStepType).map((item, index) =>
                  renderDraggableItem(
                    item,
                    index,
                    item.title === selectedStepType,
                    () => onStepTypeChange(item.title)
                  )
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {renderAddButton('stepType', !!selectedStage)}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm text-gray-400 mb-4">STEP</h2>
          <Droppable droppableId="steps">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {getFilteredItems(currentSteps, selectedStep).map((item, index) =>
                  renderDraggableItem(
                    item,
                    index,
                    item.title === selectedStep,
                    () => onStepChange(item.title)
                  )
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          {renderAddButton('step', !!selectedStepType)}
        </div>
      </div>
    </DragDropContext>
  );
}