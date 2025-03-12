"use client";

import { Menu, Activity, Filter, ChevronDown } from 'lucide-react';

export function ProjectWorkspaceHeader() {
  return (
    <header className="bg-[#002B69] p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Menu className="w-6 h-6 cursor-pointer hover:text-blue-300 transition-colors" />
        <Activity className="w-6 h-6" />
      </div>
      <div className="flex items-center space-x-4">
        <Filter className="w-6 h-6 cursor-pointer hover:text-blue-300 transition-colors" />
        <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors">Build</button>
        <button className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700 transition-colors">01 Circuit</button>
        <button className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700 transition-colors">Validation</button>
        <span className="cursor-pointer hover:text-blue-300 transition-colors">View</span>
        <button className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center">
          WORKSPACE
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>
      </div>
    </header>
  );
}