"use client";

import { useState } from "react";
import { LayoutTemplate, ChevronLeft, ArrowLeftRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProjectWorkspace } from "@/components/project-workspace";
import { AIAgent } from "@/components/ai-agent";
import { StepEditor } from "@/components/step-editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [isAIAgentCollapsed, setIsAIAgentCollapsed] = useState(false);
  const [isAIAgentOnRight, setIsAIAgentOnRight] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#002B69] p-4 flex items-center justify-between border-b border-blue-900">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold text-lg">Open Brain Platform</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="ai-position" className="text-white">SimAI Position</Label>
            <Switch
              id="ai-position"
              checked={isAIAgentOnRight}
              onCheckedChange={setIsAIAgentOnRight}
            />
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#002766] flex">
        {!isAIAgentOnRight && (
          <div className={cn(
            "relative transition-all duration-300 ease-in-out",
            isAIAgentCollapsed ? "w-0" : "w-[400px]"
          )}>
            <div className={cn(
              "absolute inset-0 p-6 transition-all duration-300",
              isAIAgentCollapsed ? "opacity-0" : "opacity-100"
            )}>
              <div className="h-full rounded-lg shadow-2xl overflow-hidden border-2 border-blue-200/30 dark:border-gray-700 bg-background">
                <AIAgent />
              </div>
            </div>
            <ChevronLeft 
              className={cn(
                "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 cursor-pointer text-white hover:text-white/80 transition-all duration-200",
                isAIAgentCollapsed ? "-right-10 rotate-180" : "-right-3"
              )}
              onClick={() => setIsAIAgentCollapsed(!isAIAgentCollapsed)}
            />
          </div>
        )}

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

        {isAIAgentOnRight && (
          <div className={cn(
            "relative transition-all duration-300 ease-in-out",
            isAIAgentCollapsed ? "w-0" : "w-[400px]"
          )}>
            <div className={cn(
              "absolute inset-0 p-6 transition-all duration-300",
              isAIAgentCollapsed ? "opacity-0" : "opacity-100"
            )}>
              <div className="h-full rounded-lg shadow-2xl overflow-hidden border-2 border-blue-200/30 dark:border-gray-700 bg-background">
                <AIAgent />
              </div>
            </div>
            <ChevronLeft 
              className={cn(
                "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 cursor-pointer text-white hover:text-white/80 transition-all duration-200",
                isAIAgentCollapsed ? "-left-10" : "-left-3",
                "rotate-180"
              )}
              onClick={() => setIsAIAgentCollapsed(!isAIAgentCollapsed)}
            />
          </div>
        )}
      </div>
    </div>
  );
}