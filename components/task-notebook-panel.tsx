"use client";

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
  return (
    <div className="w-full bg-[#002B69] rounded-lg overflow-hidden">
      <div className="p-4">
        {/* Panel content can be added here */}
      </div>
    </div>
  );
}