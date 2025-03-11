"use client";

import React, { useState } from 'react';
import { Menu, Brain, Zap, Network, Activity, FlaskRound as Flask, Play, Filter, Box, Eye, ChevronDown } from 'lucide-react';

interface ModelingItem {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
}

interface HierarchyData {
  [key: string]: {
    stages: ModelingItem[];
    stepTypes: {
      [key: string]: {
        steps: ModelingItem[];
      };
    };
  };
}

export function ModelingInterface() {
  const [selectedModelingLevel, setSelectedModelingLevel] = useState('Circuit Activity');
  const [selectedStage, setSelectedStage] = useState('Feeding Initiation');
  const [selectedStepType, setSelectedStepType] = useState('Perform');
  const [selectedStep, setSelectedStep] = useState('Excitatory neuron stimulation');
  
  const modelingLevels: ModelingItem[] = [
    { title: 'Atlas', icon: <Brain className="w-6 h-6" /> },
    { title: 'Ion Channels', icon: <Zap className="w-6 h-6" /> },
    { title: 'Neuron morphologies', icon: <Network className="w-6 h-6" /> },
    { title: 'Neuron placement', icon: <Box className="w-6 h-6" /> },
    { title: 'Connectivity', icon: <Activity className="w-6 h-6" /> },
    { title: 'Neuron Physiology', icon: <Flask className="w-6 h-6" /> },
    { title: 'Synaptic Physiology', icon: <Network className="w-6 h-6" /> },
    { title: 'Circuit', icon: <Network className="w-6 h-6" /> },
    { title: 'Circuit Activity', icon: <Activity className="w-6 h-6" />, subtitle: 'Circuit Activity Modeling Level' }
  ];

  const hierarchyData: HierarchyData = {
    'Circuit Activity': {
      stages: [
        { title: 'Feeding Initiation', icon: <Brain className="w-6 h-6" />, subtitle: 'Simulation Stage' },
        { title: 'Walking sideways', icon: <Activity className="w-6 h-6" /> },
        { title: 'Antena flex', icon: <Network className="w-6 h-6" /> }
      ],
      stepTypes: {
        'Feeding Initiation': {
          steps: [
            { title: 'Excitatory neuron stimulation', icon: <Brain className="w-6 h-6" />, subtitle: 'Circuit Simulation' },
            { title: 'Inhibitory response', icon: <Activity className="w-6 h-6" />, subtitle: 'Neural Response' },
            { title: 'Pattern generation', icon: <Network className="w-6 h-6" />, subtitle: 'Circuit Pattern' }
          ]
        },
        'Walking sideways': {
          steps: [
            { title: 'Motor neuron activation', icon: <Zap className="w-6 h-6" />, subtitle: 'Movement Pattern' },
            { title: 'Coordination analysis', icon: <Activity className="w-6 h-6" />, subtitle: 'Pattern Analysis' }
          ]
        },
        'Antena flex': {
          steps: [
            { title: 'Sensory input', icon: <Brain className="w-6 h-6" />, subtitle: 'Stimulus Response' },
            { title: 'Mechanical response', icon: <Box className="w-6 h-6" />, subtitle: 'Movement Analysis' }
          ]
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
          steps: [
            { title: 'Parameter tuning', icon: <Flask className="w-6 h-6" />, subtitle: 'Circuit Parameters' },
            { title: 'Response verification', icon: <Activity className="w-6 h-6" />, subtitle: 'Signal Analysis' }
          ]
        },
        'Validation': {
          steps: [
            { title: 'Model comparison', icon: <Eye className="w-6 h-6" />, subtitle: 'Validation Results' },
            { title: 'Error analysis', icon: <Activity className="w-6 h-6" />, subtitle: 'Statistical Analysis' }
          ]
        }
      }
    }
  };

  const currentStages = hierarchyData[selectedModelingLevel]?.stages || [];
  const currentStepTypes = [
    { title: 'Perform', icon: <Play className="w-6 h-6" />, subtitle: 'Perform Step Type' },
    { title: 'Validate', icon: <Eye className="w-6 h-6" /> },
    { title: 'Predict', icon: <Activity className="w-6 h-6" /> }
  ];
  const currentSteps = hierarchyData[selectedModelingLevel]?.stepTypes[selectedStage]?.steps || [];

  const handleModelingLevelChange = (level: string) => {
    setSelectedModelingLevel(level);
    const firstStage = hierarchyData[level]?.stages[0]?.title;
    setSelectedStage(firstStage || '');
    setSelectedStepType('Perform');
    const firstStep = hierarchyData[level]?.stepTypes[firstStage]?.steps[0]?.title;
    setSelectedStep(firstStep || '');
  };

  const handleStageChange = (stage: string) => {
    setSelectedStage(stage);
    setSelectedStepType('Perform');
    const firstStep = hierarchyData[selectedModelingLevel]?.stepTypes[stage]?.steps[0]?.title;
    setSelectedStep(firstStep || '');
  };

  return (
    <div className="bg-[#001B44] text-white">
      {/* Header */}
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

      {/* Main Content */}
      <div className="grid grid-cols-4 gap-4 p-4">
        {/* Modeling Level Column */}
        <div className="space-y-2">
          <h2 className="text-sm text-gray-400 mb-4">MODELING LEVEL</h2>
          {modelingLevels.map((item, index) => (
            <div 
              key={index} 
              className={`p-3 rounded flex items-center space-x-3 cursor-pointer transition-all hover:bg-blue-800 ${
                item.title === selectedModelingLevel ? 'bg-white bg-opacity-10' : 'bg-blue-900'
              }`}
              onClick={() => handleModelingLevelChange(item.title)}
            >
              {item.icon}
              <div>
                <div className="font-medium">{item.title}</div>
                {item.subtitle && <div className="text-sm text-gray-400">{item.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Stage Column */}
        <div className="space-y-2">
          <h2 className="text-sm text-gray-400 mb-4">STAGE</h2>
          {currentStages.map((item, index) => (
            <div 
              key={index} 
              className={`p-3 rounded flex items-center space-x-3 cursor-pointer transition-all hover:bg-blue-800 ${
                item.title === selectedStage ? 'bg-white bg-opacity-10' : 'bg-blue-900'
              }`}
              onClick={() => handleStageChange(item.title)}
            >
              {item.icon}
              <div>
                <div className="font-medium">{item.title}</div>
                {item.subtitle && <div className="text-sm text-gray-400">{item.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Step Type Column */}
        <div className="space-y-2">
          <h2 className="text-sm text-gray-400 mb-4">STEP TYPE</h2>
          {currentStepTypes.map((item, index) => (
            <div 
              key={index} 
              className={`p-3 rounded flex items-center space-x-3 cursor-pointer transition-all hover:bg-blue-800 ${
                item.title === selectedStepType ? 'bg-white bg-opacity-10' : 'bg-blue-900'
              }`}
              onClick={() => setSelectedStepType(item.title)}
            >
              {item.icon}
              <div>
                <div className="font-medium">{item.title}</div>
                {item.subtitle && <div className="text-sm text-gray-400">{item.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Step Column */}
        <div className="space-y-2">
          <h2 className="text-sm text-gray-400 mb-4">STEP</h2>
          {currentSteps.map((item, index) => (
            <div 
              key={index} 
              className={`p-3 rounded flex items-center space-x-3 cursor-pointer transition-all hover:bg-blue-800 ${
                item.title === selectedStep ? 'bg-white bg-opacity-10' : 'bg-blue-900'
              }`}
              onClick={() => setSelectedStep(item.title)}
            >
              {item.icon}
              <div>
                <div className="font-medium">{item.title}</div>
                {item.subtitle && <div className="text-sm text-gray-400">{item.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}