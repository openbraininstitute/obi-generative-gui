import { useState } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, BarChart } from 'lucide-react';
import dynamic from 'next/dynamic';

const CodeEditor = dynamic(
  () => import('@uiw/react-textarea-code-editor').then((mod) => mod.default),
  { ssr: false }
);

interface Simulation {
  id: string;
  name: string;
  status: 'completed' | 'running' | 'failed';
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

const MOCK_CAMPAIGN: SimulationCampaign = {
  id: '1',
  name: 'Circuit Activity Analysis',
  simulations: Array.from({ length: 12 }, (_, i) => ({
    id: `sim-${i + 1}`,
    name: `Simulation ${i + 1}`,
    status: i < 8 ? 'completed' : i < 10 ? 'running' : 'failed',
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
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(MOCK_CAMPAIGN.simulations[0]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

  const generateSpikes = () => {
    return Array.from({ length: 1000 }).map(() => ({
      neuron: Math.floor(Math.random() * 100),
      time: Math.random() * 100
    }));
  };

  const spikes = generateSpikes();

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
      <ScrollArea className="p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">SIMULATIONS</h2>
        <div className="space-y-1">
          {MOCK_CAMPAIGN.simulations.map((sim) => (
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
              <FolderOpen className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{sim.name}</span>
              <span className={cn(
                "ml-auto text-xs px-1.5 py-0.5 rounded-full",
                sim.status === 'completed' ? "bg-green-500/20 text-green-500" :
                sim.status === 'running' ? "bg-blue-500/20 text-blue-500" :
                "bg-red-500/20 text-red-500"
              )}>
                {sim.status}
              </span>
            </button>
          ))}
        </div>
      </ScrollArea>

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
        </div>
        {!selectedSimulation && (
          <div className="flex items-center justify-center h-[calc(100%-2rem)] text-sm text-muted-foreground">
            Select a simulation to view files
          </div>
        )}
      </ScrollArea>

      {/* File Content */}
      <div className="p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">CONTENT</h2>
        {selectedSimulation && (selectedFile || selectedPlot) ? (
          <div className="h-[calc(100%-2rem)]">
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
            ) : selectedPlot === 'spike-raster' ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-full h-full bg-black/5 dark:bg-white/5 rounded-lg p-4">
                  <div className="w-full h-full relative">
                    <div className="absolute inset-8 flex items-center justify-center">
                      {spikes.map((spike, i) => (
                        <div 
                          key={i}
                          className="absolute"
                          style={{
                            top: `${spike.neuron}%`,
                            left: `${spike.time}%`,
                            width: '2px',
                            height: '2px',
                            backgroundColor: 'currentColor'
                          }}
                        />
                      ))}
                    </div>
                    <div className="absolute left-0 top-0 h-full w-8 flex flex-col justify-between text-xs text-muted-foreground">
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                    <div className="absolute bottom-0 left-8 right-0 h-8 flex justify-between text-xs text-muted-foreground">
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