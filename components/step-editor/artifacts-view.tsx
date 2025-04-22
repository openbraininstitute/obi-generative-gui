import { useState } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        }, null, 2)
      },
      {
        name: 'circuit_config.json',
        content: JSON.stringify({
          connectivity: 'random',
          synaptic_strength: 0.5
        }, null, 2)
      },
      {
        name: 'input.h5',
        content: 'HDF5 binary content'
      },
      {
        name: 'output.h5',
        content: 'HDF5 binary content'
      },
      {
        name: 'node_sets.json',
        content: JSON.stringify({
          excitatory: [1, 2, 3, 4, 5],
          inhibitory: [6, 7, 8, 9, 10]
        }, null, 2)
      }
    ]
  }))
};

export function ArtifactsView() {
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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
        <h2 className="text-sm font-medium text-muted-foreground mb-4">FILES</h2>
        {selectedSimulation ? (
          <div className="space-y-1">
            {selectedSimulation.files.map((file) => (
              <button
                key={file.name}
                onClick={() => setSelectedFile(file.name)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm hover:bg-muted text-left",
                  selectedFile === file.name ? "bg-muted" : "text-muted-foreground"
                )}
              >
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100%-2rem)] text-sm text-muted-foreground">
            Select a simulation to view files
          </div>
        )}
      </ScrollArea>

      {/* File Content */}
      <div className="p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">CONTENT</h2>
        {selectedSimulation && selectedFile ? (
          <div className="h-[calc(100%-2rem)]">
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
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100%-2rem)] text-sm text-muted-foreground">
            {selectedSimulation 
              ? 'Select a file to view its content'
              : 'Select a simulation and file to view content'
            }
          </div>
        )}
      </div>
    </div>
  );
}