"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { ProjectWorkspace } from "@/components/project-workspace";
import { AIAgent } from "@/components/ai-agent";
import { StepEditor } from "@/components/step-editor";

export default function Home() {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#002B69] p-4 flex items-center justify-between border-b border-blue-900">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold text-lg">Open Brain Platform</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 transition-colors text-white">
            Build
          </button>
          <button className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700 transition-colors text-white">
            01 Circuit
          </button>
          <button className="bg-blue-800 px-4 py-2 rounded hover:bg-blue-700 transition-colors text-white">
            Validation
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#002766] flex">
        {/* Left Side - AI Agent */}
        <div className="w-[400px] p-6">
          <div className="h-full rounded-lg shadow-2xl overflow-hidden border-2 border-blue-200/30 dark:border-gray-700 bg-background">
            <AIAgent />
          </div>
        </div>

        {/* Right Side - Project Workspace and Step Editor */}
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col">
            <ProjectWorkspace onStepSelect={setSelectedStep} />
            {selectedStep && (
              <div className="px-8 mt-6 flex-1">
                <StepEditor />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}