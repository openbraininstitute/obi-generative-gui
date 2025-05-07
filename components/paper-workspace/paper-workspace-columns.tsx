"use client";

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { usePaperWorkspace } from './paper-workspace-provider';
import { cn } from '@/lib/utils';
import { TreeNode } from './types';

interface PaperWorkspaceColumnsProps {
  onSectionSelect: (section: string | null) => void;
}

const treeData: TreeNode[] = [
  {
    id: 'atlas',
    label: 'ATLAS',
  },
  {
    id: 'ion-channels',
    label: 'ION CHANNELS',
  },
  {
    id: 'neuron-morphologies',
    label: 'NEURON MORPHOLOGIES',
  },
  {
    id: 'neuron-placement',
    label: 'NEURON PLACEMENT',
  },
  {
    id: 'connectivity',
    label: 'CONNECTIVITY',
  },
  {
    id: 'neuron-physiology',
    label: 'NEURON PHYSIOLOGY',
  },
  {
    id: 'synaptic-physiology',
    label: 'SYNAPTIC PHYSIOLOGY',
  },
  {
    id: 'circuit',
    label: 'CIRCUIT',
  },
  {
    id: 'circuit-activity',
    label: 'CIRCUIT ACTIVITY',
    children: [
      {
        id: 'walking-sideways',
        label: 'WALKING SIDEWAYS',
      },
      {
        id: 'antenna-flex',
        label: 'ANTENNA FLEX',
      },
      {
        id: 'food-initiation',
        label: 'FOOD INITIATION',
        children: [
          {
            id: 'perform',
            label: 'PERFORM',
            children: [
              {
                id: 'excitatory-neuron-stimulation',
                label: 'EXCITATORY NEURON STIMULATION',
                children: [
                  {
                    id: 'rationale',
                    label: 'RATIONALE, METHODS, ASSUMPTIONS',
                    content: 'To compare the stimulus-evoked responses of the network to in vivo, we performed a parameter scan. Particularly, we varied the three meta-parameters X, Y, Z as well as the number of fibers in the stimulus. This was to account for the uncertainty in the corresponding values in vivo. Also the which varied the number of For each parameter combination we simulated 11 whisker deflections at 1Hz intervals starting after 1000ms. We recommend that the first whisker deflection is ignored, as it produces a large response as synaptic vesicles are full from the initiation of the circuit.'
                  }
                ]
              }
            ]
          },
          {
            id: 'validations',
            label: 'VALIDATIONS',
          },
          {
            id: 'predictions',
            label: 'PREDICTIONS',
          }
        ]
      }
    ]
  }
];

export function PaperWorkspaceColumns({ onSectionSelect }: PaperWorkspaceColumnsProps) {
  const {
    selectedSection,
    setSelectedSection
  } = usePaperWorkspace();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = node.id === selectedSection;
    const showContent = node.content && isExpanded;

    return (
      <div key={node.id} style={{ paddingLeft: `${level * 20}px` }}>
        <div
          className={cn(
            "flex items-center py-1 cursor-pointer text-sm text-foreground/70 hover:text-foreground",
            isSelected && "text-[#40A9FF]"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            setSelectedSection(node.id);
            onSectionSelect(node.id);
          }}
        >
          {hasChildren && (
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "transform rotate-90"
              )}
            />
          )}
          <span className={cn("ml-1", !hasChildren && "ml-5")}>
            {node.label}
          </span>
        </div>
        {showContent && (
          <div className="pl-5 py-2 text-sm text-foreground/60">
            {node.content}
          </div>
        )}
        {isExpanded && node.children?.map(child => renderNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div>
      {treeData.map(node => renderNode(node))}
    </div>
  );
}