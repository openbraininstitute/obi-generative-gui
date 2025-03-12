"use client";

import { Book, ChevronRight, FileText } from 'lucide-react';

interface TaskItem {
  id: string;
  type: 'task' | 'notebook';
  title: string;
  description: string;
  lastModified: string;
}

interface TaskNotebookPanelProps {
  selectedTaskType: 'task' | 'notebook';
  selectedTaskId: string | null;
  showTasksTable: boolean;
  onTaskTypeChange: (type: 'task' | 'notebook') => void;
  onTaskSelect: (taskId: string) => void;
  onToggleTasksTable: () => void;
}

export function TaskNotebookPanel({
  selectedTaskType,
  selectedTaskId,
  showTasksTable,
  onTaskTypeChange,
  onTaskSelect,
  onToggleTasksTable
}: TaskNotebookPanelProps) {
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

  const getFilteredTasks = () => {
    const typeFilteredTasks = tasks.filter(task => task.type === selectedTaskType);
    if (!showTasksTable) {
      return typeFilteredTasks.filter(task => task.id === selectedTaskId);
    }
    return typeFilteredTasks;
  };

  return (
    <div className="w-1/2 bg-[#002B69] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-blue-800">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onTaskTypeChange('task')}
            className={`flex items-center space-x-2 px-4 py-2 rounded ${
              selectedTaskType === 'task' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => onTaskTypeChange('notebook')}
            className={`flex items-center space-x-2 px-4 py-2 rounded ${
              selectedTaskType === 'notebook' ? 'bg-blue-700' : 'hover:bg-blue-800'
            }`}
          >
            <Book className="w-5 h-5" />
            <span>Notebooks</span>
          </button>
        </div>
        <button
          onClick={onToggleTasksTable}
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
                onClick={() => onTaskSelect(task.id)}
                className={`border-t border-blue-800 cursor-pointer hover:bg-blue-800/50 ${
                  selectedTaskId === task.id ? 'bg-white text-[#002766]' : ''
                }`}
              >
                <td className="px-6 py-4 flex items-center space-x-2">
                  {task.type === 'task' ? (
                    <FileText className={`w-4 h-4 ${selectedTaskId === task.id ? 'text-[#002766]' : 'text-blue-300'}`} />
                  ) : (
                    <Book className={`w-4 h-4 ${selectedTaskId === task.id ? 'text-[#002766]' : 'text-blue-300'}`} />
                  )}
                  <span>{task.title}</span>
                </td>
                <td className={`px-6 py-4 ${selectedTaskId === task.id ? 'text-[#002766]' : 'text-gray-300'}`}>
                  {task.description}
                </td>
                <td className={`px-6 py-4 ${selectedTaskId === task.id ? 'text-[#002766]' : 'text-gray-300'}`}>
                  {task.lastModified}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}