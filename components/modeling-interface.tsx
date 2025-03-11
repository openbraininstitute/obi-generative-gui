"use client";

import React, { useState, useEffect } from 'react';
import { Menu, Brain, Zap, Network, Activity, FlaskRound as Flask, Play, Filter, Box, Eye, ChevronDown, Plus, Book, FileText, ChevronRight, ListFilter } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ModelingItem {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
}

interface TaskItem {
  id: string;
  type: 'task' | 'notebook';
  title: string;
  description: string;
  lastModified: string;
}

interface HierarchyData {
  [key: string]: {
    stages: ModelingItem[];
    stepTypes: {
      [key: string]: {
        types: {
          [key: string]: {
            steps: ModelingItem[];
          };
        };
      };
    };
  };
}

export function ModelingInterface() {
  const [selectedModelingLevel, setSelectedModelingLevel] = useState('Circuit Activity');
  const [selectedStage, setSelectedStage] = useState('Feeding Initiation');
  const [selectedStepType, setSelectedStepType] = useState('Perform');
  const [selectedStep, setSelectedStep] = useState('');
  const [isAddingTo, setIsAddingTo] = useState<'level' | 'stage' | 'stepType' | 'step' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTasksTable, setShowTasksTable] = useState(true);
  const [selectedTaskType, setSelectedTaskType] = useState<'task' | 'notebook'>('task');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'all' | 'active' | 'completed'>('all');

  const tasks: TaskItem[] = [
    {
      id: '1',
      type: 'task',
      title: 'Neural Network Training',
      description: 'Train the neural network with the new dataset',
      lastModified: '2025-02-20'
    },
    {
      id: '2',
      type: 'notebook',
      title: 'Data Analysis Notebook',
      description: 'Analyze neural response patterns',
      lastModified: '2025-02-19'
    },
    {
      id: '3',
      type: 'task',
      title: 'Parameter Optimization',
      description: 'Optimize network parameters',
      lastModified: '2025-02-18'
    },
    {
      id: '4',
      type: 'notebook',
      title: 'Visualization Notebook',
      description: 'Neural activity visualizations',
      lastModified: '2025-02-17'
    }
  ];

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

  const [hierarchyData, setHierarchyData] = useState<HierarchyData>({
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
        },
        'Walking sideways': {
          types: {}
        },
        'Antena flex': {
          types: {}
        }
      }
    },
    'Circuit': {
      stages: [
        { title: 'Calibration', icon: <Flask className="w-6 h-6" /> },
        { title: 'Validation', icon: <Eye className="w-6 h-6" /> }
      ],
      stepTypes: {
        'Calibration': {
          types: {}
        },
        'Validation': {
          types: {}
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

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowTasksTable(false);
  };

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
        
        setSelectedModelingLevel(newItemName);
        setSelectedStage('');
        setSelectedStepType('');
        setSelectedStep('');
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
        setSelectedStage(newItemName);
        setSelectedStepType('');
        setSelectedStep('');
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
        setSelectedStepType(newItemName);
        setSelectedStep('');
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
        setSelectedStep(newItemName);
        break;
    }

    setNewItemName('');
    setIsAddingTo(null);
  };

  const handleModelingLevelChange = (level: string) => {
    setSelectedModelingLevel(level);
    const firstStage = hierarchyData[level]?.stages[0]?.title;
    setSelectedStage(firstStage || '');
    setSelectedStepType('');
    setSelectedStep('');
    setIsCollapsed(false);
  };

  const handleStageChange = (stage: string) => {
    setSelectedStage(stage);
    setSelectedStepType('');
    setSelectedStep('');
    setIsCollapsed(false);
  };

  const handleStepTypeChange = (type: string) => {
    setSelectedStepType(type);
    setSelectedStep('');
    setIsCollapsed(false);
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
          className={`p-3 rounded cursor-pointer transition-all duration-300 ${
            isSelected 
              ? 'bg-white text-[#001B44]' 
              : 'bg-blue-900 text-white hover:bg-blue-800'
          }`}
          onClick={onClick}
        >
          <div className="flex items-center space-x-3">
            <div className={isSelected ? 'text-[#001B44]' : 'text-white'}>
              {item.icon}
            </div>
            <div>
              <div className="font-medium">{item.title}</div>
              {item.subtitle && (
                <div className={`text-sm ${isSelected ? 'text-[#001B44]/70' : 'text-gray-400'}`}>
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
        <div className="p-3 rounded bg-blue-900 flex items-center space-x-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewItem()}
            className="flex-1 bg-blue-800 text-white rounded px-2 py-1"
            placeholder="Enter name..."
            autoFocus
          />
          <button 
            onClick={handleAddNewItem}
            className="text-blue-300 hover:text-blue-100"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingTo(type)}
          className="w-full p-3 rounded bg-blue-900 hover:bg-blue-800 flex items-center justify-center space-x-2 text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Add {type.charAt(0).toUpperCase() + type.slice(1)}</span>
        </button>
      )
    );
  };

  const getFilteredTasks = () => {
    const typeFilteredTasks = tasks.filter(task => task.type === selectedTaskType);
    if (!showTasksTable) {
      return typeFilteredTasks.filter(task => task.id === selectedTaskId);
    }
    return typeFilteredTasks;
  };

  return (
    <div className="bg-[#001B44] text-white">
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
                      () => handleModelingLevelChange(item.title)
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
                      () => handleStageChange(item.title)
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
                      () => handleStepTypeChange(item.title)
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
                      () => setSelectedStep(item.title)
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

      {selectedStep && (
        <div className="px-4 pb-4 flex gap-4">
          <div className="w-1/2 bg-[#002B69] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-blue-800">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedTaskType('task')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded ${
                    selectedTaskType === 'task' ? 'bg-blue-700' : 'hover:bg-blue-800'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Tasks</span>
                </button>
                <button
                  onClick={() => setSelectedTaskType('notebook')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded ${
                    selectedTaskType === 'notebook' ? 'bg-blue-700' : 'hover:bg-blue-800'
                  }`}
                >
                  <Book className="w-5 h-5" />
                  <span>Notebooks</span>
                </button>
              </div>
              <button
                onClick={() => setShowTasksTable(!showTasksTable)}
                className="text-blue-300 hover:text-blue-100"
              >
                <ChevronRight
                  className={`w-6 h-6 transform transition-transform ${
                    showTasksTable ? 'rotate-90' : ''
                  }`}
                />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={showTasksTable ? 'block' : 'hidden'}>
                  <tr className="text-left bg-blue-900/50">
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredTasks().map(task => (
                    <tr
                      key={task.id}
                      onClick={() => handleTaskSelect(task.id)}
                      className={`border-t border-blue-800 cursor-pointer hover:bg-blue-800/50 ${
                        selectedTaskId === task.id ? 'bg-white text-[#001B44]' : ''
                      }`}
                    >
                      <td className="px-6 py-4 flex items-center space-x-2">
                        {task.type === 'task' ? (
                          <FileText className={`w-4 h-4 ${selectedTaskId === task.id ? 'text-[#001B44]' : 'text-blue-300'}`} />
                        ) : (
                          <Book className={`w-4 h-4 ${selectedTaskId === task.id ? 'text-[#001B44]' : 'text-blue-300'}`} />
                        )}
                        <span>{task.title}</span>
                      </td>
                      <td className={`px-6 py-4 ${selectedTaskId === task.id ? 'text-[#001B44]' : 'text-gray-300'}`}>
                        {task.description}
                      </td>
                      <td className={`px-6 py-4 ${selectedTaskId === task.id ? 'text-[#001B44]' : 'text-gray-300'}`}>
                        {task.lastModified}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <div className="bg-[#002B69] rounded-lg overflow-hidden flex">
              <button
                onClick={() => setSelectedView('all')}
                className={`px-6 py-3 flex items-center space-x-2 ${
                  selectedView === 'all' ? 'bg-blue-700' : 'hover:bg-blue-800'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>All</span>
              </button>
              <button
                onClick={() => setSelectedView('active')}
                className={`px-6 py-3 flex items-center space-x-2 ${
                  selectedView === 'active' ? 'bg-blue-700' : 'hover:bg-blue-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Active</span>
              </button>
              <button
                onClick={() => setSelectedView('completed')}
                className={`px-6 py-3 flex items-center space-x-2 ${
                  selectedView === 'completed' ? 'bg-blue-700' : 'hover:bg-blue-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Completed</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}