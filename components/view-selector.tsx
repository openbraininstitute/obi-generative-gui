"use client";

import { Activity, Eye, ListFilter } from 'lucide-react';

interface ViewSelectorProps {
  selectedView: 'all' | 'active' | 'completed';
  onViewChange: (view: 'all' | 'active' | 'completed') => void;
}

export function ViewSelector({
  selectedView,
  onViewChange
}: ViewSelectorProps) {
  return (
    <div className="flex items-start space-x-2">
      <div className="bg-[#002B69] rounded-lg overflow-hidden flex">
        <button
          onClick={() => onViewChange('all')}
          className={`px-6 py-3 flex items-center space-x-2 ${
            selectedView === 'all' ? 'bg-blue-700' : 'hover:bg-blue-800'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>All</span>
        </button>
        <button
          onClick={() => onViewChange('active')}
          className={`px-6 py-3 flex items-center space-x-2 ${
            selectedView === 'active' ? 'bg-blue-700' : 'hover:bg-blue-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Active</span>
        </button>
        <button
          onClick={() => onViewChange('completed')}
          className={`px-6 py-3 flex items-center space-x-2 ${
            selectedView === 'completed' ? 'bg-blue-700' : 'hover:bg-blue-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Completed</span>
        </button>
      </div>
    </div>
  );
}