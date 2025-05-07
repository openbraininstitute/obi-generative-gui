"use client";

import { cn } from "@/lib/utils";
import { ModelingItem } from "./types";
import { DraggableProvided } from "@hello-pangea/dnd";

interface ColumnHeaderProps {
  title: string;
}

export function ColumnHeader({ title }: ColumnHeaderProps) {
  return (
    <h2 className="text-sm text-[#40A9FF] font-medium">{title}</h2>
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
          ? "bg-background text-[#002766] dark:text-white border border-blue-200/30 dark:border-gray-700" 
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