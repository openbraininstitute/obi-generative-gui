"use client";

import { PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModelingItem } from './types';
import { DraggableProvided } from '@hello-pangea/dnd';

interface ColumnHeaderProps {
  title: string;
}

export function ColumnHeader({ title }: ColumnHeaderProps) {
  return (
    <h2 className="text-sm text-[#40A9FF] mb-4 text-center font-medium">{title}</h2>
  );
}

interface AddButtonProps {
  type: 'level' | 'stage' | 'stepType' | 'step';
  isAddingTo: string | null;
  newItemName: string;
  onNameChange: (name: string) => void;
  onAdd: () => void;
  onCancel: () => void;
  onClick: () => void;
}

export function AddButton({
  type,
  isAddingTo,
  newItemName,
  onNameChange,
  onAdd,
  onCancel,
  onClick
}: AddButtonProps) {
  if (isAddingTo === type) {
    return (
      <div className="p-3 rounded bg-transparent border border-[#40A9FF] flex items-center space-x-2 mt-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          className="flex-1 bg-blue-800/30 dark:bg-black/30 text-white rounded px-2 py-1"
          placeholder="Enter name..."
          autoFocus
        />
        <button 
          onClick={onAdd}
          className="text-white hover:text-white/80"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="text-white hover:text-white/80 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded bg-transparent border border-[#40A9FF] hover:bg-blue-800/30 dark:hover:bg-black/30 flex items-center justify-center space-x-2 text-white mt-2"
    >
      <PlusCircle className="w-4 h-4" />
      <span>Add {type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </button>
  );
}

interface DraggableItemProps {
  item: ModelingItem;
  isSelected: boolean;
  provided: DraggableProvided;
  onClick: () => void;
}

export function DraggableItem({
  item,
  isSelected,
  provided,
  onClick
}: DraggableItemProps) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        "p-3 rounded cursor-pointer mb-2",
        isSelected 
          ? "bg-white dark:bg-black text-[#002766] dark:text-white border border-blue-200/30 dark:border-gray-700" 
          : "bg-transparent border border-[#40A9FF] text-white hover:bg-blue-800/30 dark:hover:bg-black/30"
      )}
      onClick={onClick}
      style={{
        ...provided.draggableProps.style,
        transition: provided.draggableProps.style?.transition
          ? `${provided.draggableProps.style.transition}, background-color 0.2s ease-in-out`
          : 'background-color 0.2s ease-in-out'
      }}
    >
      <div className="flex items-center space-x-3">
        <div className={isSelected ? "text-[#002766] dark:text-white" : "text-white"}>
          {item.icon}
        </div>
        <div className="font-medium truncate">
          {item.title}
        </div>
      </div>
    </div>
  );
}