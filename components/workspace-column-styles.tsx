"use client";

import { PlusCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModelingItem } from '@/types/workspace';
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
      <div className="p-3 rounded bg-transparent border border-[#1890FF] flex items-center space-x-2 mt-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          className="flex-1 bg-blue-800/30 text-white rounded px-2 py-1"
          placeholder="Enter name..."
          autoFocus
        />
        <button 
          onClick={onAdd}
          className="text-white/70 hover:text-white"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="text-white/70 hover:text-white ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded bg-transparent border border-[#1890FF] hover:bg-blue-800/30 flex items-center justify-center space-x-2 text-white/70 mt-2"
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
        "p-3 rounded cursor-pointer transition-all duration-300 mb-2",
        isSelected 
          ? "bg-white text-[#002766]" 
          : "bg-transparent border border-[#1890FF] text-white/70 hover:bg-blue-800/30"
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={isSelected ? "text-[#002766]" : "text-white/70"}>
          {item.icon}
        </div>
        <div>
          <div className="font-medium">{item.title}</div>
          {item.subtitle && (
            <div className={cn(
              "text-sm",
              isSelected ? "text-[#002766]/70" : "text-gray-400"
            )}>
              {item.subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}