"use client";

import { useState } from 'react';
import { useEffect } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, BarChart, Play, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

interface Simulation {
  id: string;
  name: string;
  status: 'Generating' | 'Ready' | 'Queuing' | 'Running' | 'Complete';
  files: {
    name: string;
    content: string;
    type?: 'input' | 'output' | 'plot';
  }[];
}

interface SimulationCampaign {
  id: string;
  name: string;
  simulations: Simulation[];
}

interface NeuronSet {
  id: string;
  name: string;
  neurons: number[];
}

const NEURON_SETS: NeuronSet[] = [
  {
    id: 'all',
    name: 'All Neurons',
    neurons: Array.from({ length: 100 }, (_, i) => i)
  },
  {
    id: 'l5e',
    name: 'Layer 5 Excitatory',
    neurons: Array.from({ length: 40 }, (_, i) => i)
  },
  {
    id: 'l5i',
    name: 'Layer 5 Inhibitory',
    neurons: Array.from({ length: 20 }, (_, i) => i + 40)
  },
  {
    id: 'l23e',
    name: 'Layer 2/3 Excitatory',
    neurons: Array.from({ length: 25 }, (_, i) => i + 60)
  },
  {
    id: 'l23i',
    name: 'Layer 2/3 Inhibitory',
    neurons: Array.from({ length: 15 }, (_, i) => i + 85)
  }
];

const MOCK_CAMPAIGN: SimulationCampaign = {
  id: '1',
  name: 'Circuit Activity Analysis',
  simulations: Array.from({ length: 12 }, (_, i) => ({
    id: `sim-${i + 1}`,
    name: `Simulation ${i + 1}`,
    status: 'Generating',
    files: [
      {
        name: 'simulation_config.json',
        content: JSON.stringify({
          timestep: 0.1,
          duration: 1000,
          neurons: 100
        }, null, 2),
        type: 'input'
      },
      {
        name: 'circuit_config.json',
        content: JSON.stringify({
          connectivity: 'random',
          synaptic_strength: 0.5
        }, null, 2),
        type: 'input'
      },
      {
        name: 'input.h5',
        content: 'HDF5 binary content',
        type: 'input'
      },
      {
        name: 'output.h5',
        content: 'HDF5 binary content',
        type: 'output'
      },
      {
        name: 'node_sets.json',
        content: JSON.stringify({
          excitatory: [1, 2, 3, 4, 5],
          inhibitory: [6, 7, 8, 9, 10]
        }, null, 2),
        type: 'input'
      },
      {
        name: 'spike_raster',
        content: '',
        type: 'plot'
      }
    ]
  }))
};

export function ArtifactsView() {
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [selectedSimulations, setSelectedSimulations] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);
  const [selectedNeuronSet, setSelectedNeuronSet] = useState<string>('all');
  const [simulations, setSimulations] = useState<Simulation[]>(MOCK_CAMPAIGN.simulations);

  // Update middle panel when selected simulation completes
  useEffect(() => {
    if (selectedSimulation) {
      const updatedSim = simulations.find(sim => sim.id === selectedSimulation.id);
      if (updatedSim?.status === 'Complete') {
        setSelectedPlot('spike-raster');
        setSelectedFile(null);
      }
    }
  }, [simulations, selectedSimulation]);

  useEffect(() => {
    // Wait 1.5 seconds before starting transitions
    const timeout = setTimeout(() => {
      simulations.forEach((sim, index) => {
        setTimeout(() => {
          setSimulations(prev => prev.map((s, i) => 
            i === index ? { ...s, status: 'Ready' } : s
          ));
        }, index * 250); // Transition each simulation 250ms after the previous one
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  const generateSpikes = () => {
    const activeNeurons = NEURON_SETS.find(set => set.id === selectedNeuronSet)?.neurons || [];
    return Array.from({ length: 1000 }).map(() => ({
      neuron: activeNeurons[Math.floor(Math.random() * activeNeurons.length)],
      time: Math.random() * 100
    }));
  };

  const spikes = selectedPlot === 'spike-raster' ? generateSpikes() : [];

  const renderFileButton = (file: { name: string; content: string }) => (
    <button
      key={file.name}
      onClick={() => {
        setSelectedFile(file.name);
        setSelectedPlot(null);
      }}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-muted text-left",
        selectedFile === file.name ? "bg-muted" : "text-muted-foreground"
      )}
    >
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{file.name}</span>
    </button>
  );

  return (
    <div className="grid grid-cols-[250px_300px_1fr] h-full divide-x">
      {/* Simulations List */}
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            checked={selectedSimulations.size === MOCK_CAMPAIGN.simulations.length}
            className="h-2.5 w-2.5 flex-shrink-0 border data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground"
            onClick={() => {
              setSelectedSimulations(prev => {
                if (prev.size === MOCK_CAMPAIGN.simulations.length) {
                  return new Set();
                }
                return new Set(MOCK_CAMPAIGN.simulations.map(sim => sim.id));
              });
            }}
          />
          <div className="flex items-center justify-between w-full">
            <h2 className="text-sm font-medium text-muted-foreground">SIMULATIONS</h2>
            {simulations.some(sim => sim.status === 'Complete') && (
              <Button
                size="sm" 
                variant="secondary"
                className="h-8"
              >
                Analyze
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {simulations.map((sim) => (
            <button
              key={sim.id}
              onClick={() => {
                setSelectedSimulation(sim);
                setSelectedFile(null);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-muted text-left",
                selectedSimulation?.id === sim.id ? "bg-muted" : "text-muted-foreground"
              )}
            >
              <Checkbox
                checked={selectedSimulations.has(sim.id)}
                className="h-2.5 w-2.5 flex-shrink-0 border data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSimulations(prev => {
                    const next = new Set(prev);
                    if (next.has(sim.id)) {
                      next.delete(sim.id);
                    } else {
                      next.add(sim.id);
                    }
                    return next;
                  });
                }}
              />
              <span className="truncate">{sim.name}</span>
              <span className={cn(
                "ml-auto text-xs px-1.5 py-0.5 rounded-full",
                sim.status === 'Generating' ? "bg-muted text-muted-foreground" :
                sim.status === 'Queuing' ? "bg-yellow-500/20 text-yellow-500" :
                sim.status === 'Running' ? "bg-orange-500/20 text-orange-500" :
                sim.status === 'Complete' ? "bg-green-500/20 text-green-500" :
                "bg-blue-500/20 text-blue-500"
              )}>
                {sim.status}
              </span>
            </button>
          ))}
        </div>
        </ScrollArea>
        {selectedSimulations.size > 0 && (
          <div className="flex-none p-4 border-t space-x-2">
            <div className="flex justify-end gap-2">
              <Button 
                size="sm"
                variant="default"
                className="h-8"
                style={{ backgroundColor: '#22c55e', color: 'white' }}
                onClick={() => {
                  const selectedIds = Array.from(selectedSimulations);
                  
                  // Set initial Queuing status
                  setSimulations(prev => prev.map(sim => {
                    if (selectedSimulations.has(sim.id)) {
                      return { ...sim, status: 'Queuing' };
                    }
                    return sim;
                  }));
                  
                  // After 1 seconds, change to Running
                  setTimeout(() => {
                    setSimulations(prev => prev.map(sim => {
                      if (selectedIds.includes(sim.id)) {
                        return { ...sim, status: 'Running' };
                      }
                      return sim;
                    }));
                    
                    // After 1.5 more seconds, change to Complete
                    setTimeout(() => {
                      setSimulations(prev => prev.map(sim => {
                        if (selectedIds.includes(sim.id)) {
                          const completedSim = { ...sim, status: 'Complete' };
                          // If this is the selected simulation, update selectedSimulation
                          if (selectedSimulation?.id === sim.id) {
                            setSelectedSimulation(completedSim);
                          }
                          return completedSim;
                        }
                        return sim;
                      }));
                    }, 1500);
                  }, 1000);
                  
                  setSelectedSimulations(new Set());
                }}
              >
                <Play className="h-4 w-4" />
              </Button>
              <Button 
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => {
                  // Handle download
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                size="sm"
                variant="destructive"
                className="h-8"
                onClick={() => {
                  // Handle delete
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Files List */}
      <ScrollArea className="p-4">
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-4">INPUT FILES</h2>
            <div className="space-y-1">
              {selectedSimulation?.files
                .filter(file => file.type === 'input')
                .map(renderFileButton)}
            </div>
          </div>
          {selectedSimulation?.status === 'Complete' && (
            <>
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4">OUTPUT FILES</h2>
                <div className="space-y-1">
                  {selectedSimulation?.files
                    .filter(file => file.type === 'output')
                    .map(renderFileButton)}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-4">SUMMARY PLOTS</h2>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedPlot('spike-raster');
                      setSelectedFile(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-muted text-left",
                      selectedPlot === 'spike-raster' ? "bg-muted" : "text-muted-foreground"
                    )}
                  >
                    <BarChart className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Spike Raster</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        {!selectedSimulation && (
          <div className="flex items-center justify-center h-[calc(100%-2rem)] text-sm text-muted-foreground">
            Select a simulation to view files
          </div>
        )}
      </ScrollArea>

      {/* File Content */}
      <div className="p-4">
        {selectedPlot === 'spike-raster' && selectedSimulation?.status === 'Complete' && (
          <div className="flex items-center justify-between mb-4">
            <Select value={selectedNeuronSet} onValueChange={setSelectedNeuronSet}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select neuron set" />
              </SelectTrigger>
              <SelectContent>
                {NEURON_SETS.map(set => (
                  <SelectItem key={set.id} value={set.id}>{set.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {selectedSimulation && (selectedFile || selectedPlot) ? (
          <div className="h-[calc(100%-4rem)]">
            {selectedFile ? (
              <CodeEditor
                value={selectedSimulation.files.find(f => f.name === selectedFile)?.content || ''}
                language={selectedFile.endsWith('.json') ? 'json' : 'plaintext'}
                readOnly
                padding={15}
                style={{
                  fontSize: 14,
                  backgroundColor: 'transparent',
                  fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                  height: '100%'
                }}
              />
            ) : selectedPlot === 'spike-raster' && selectedSimulation?.status === 'Complete' ? (
              <div className="h-full flex items-center justify-center relative">
                <div className="w-full h-full bg-black/5 dark:bg-white/5 rounded-lg p-4">
                  <div className="w-full h-full relative overflow-hidden">
                    <div className="absolute inset-0">
                      {spikes.map((spike, i) => (
                        <div 
                          key={i}
                          className="absolute"
                          style={{
                            top: `${(spike.neuron / 100) * 100}%`,
                            left: `${spike.time}%`,
                            width: '2px',
                            height: '2px',
                            backgroundColor: 'currentColor'
                          }}
                        />
                      ))}
                    </div>
                    <div className="absolute -left-8 top-0 h-full w-8 flex flex-col justify-between text-xs text-muted-foreground">
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                    <div className="absolute -bottom-8 left-0 right-0 h-8 flex justify-between text-xs text-muted-foreground">
                      <span>0ms</span>
                      <span>500ms</span>
                      <span>1000ms</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100%-2rem)] text-sm text-muted-foreground">
            {selectedSimulation 
              ? 'Select a file or plot to view'
              : 'Select a simulation and file or plot to view'
            }
          </div>
        )}
      </div>
    </div>
  );
}