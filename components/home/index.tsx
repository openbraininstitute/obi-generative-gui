"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ProjectWorkspace } from "@/components/project-workspace";
import { ComponentSelector } from "@/components/component-selector";
import { AIAgent } from "@/components/ai-agent";
import { StepEditor } from "@/components/step-editor";
import { cn } from "@/lib/utils";
import { PublicRuntimeConfig } from "@/lib/config.server";

export default function HomeComponent({ config }: { config: PublicRuntimeConfig }) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(true);
  const [isAIAgentCollapsed, setIsAIAgentCollapsed] = useState(false);
  const [isAIAgentOnRight, setIsAIAgentOnRight] = useState(false);

  useEffect(() => {
    if (selectedStep && selectedComponents.length > 0) {
      setIsWorkspaceVisible(false);
    }
  }, [selectedStep, selectedComponents]);

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
      <div className="flex-1 bg-[#002766] flex overflow-hidden">
        {!isAIAgentOnRight && (
          <div className={cn("relative transition-all duration-300 ease-in-out h-full",
            isAIAgentCollapsed ? "w-0" : "w-[400px]")}>
            <div className={cn("absolute inset-0 p-6 pb-8 transition-all duration-300",
              isAIAgentCollapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
              <div className="h-full rounded-lg shadow-2xl overflow-hidden border-2 border-blue-200/30 dark:border-gray-700 bg-background">
                <AIAgent />
              </div>
            </div>
            <ChevronLeft 
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-white hover:text-white/80 transition-all duration-200 z-50",
                isAIAgentCollapsed ? "-right-8 rotate-180" : "-right-3"
              )}
              onClick={() => setIsAIAgentCollapsed(!isAIAgentCollapsed)}
            />
          </div>
        )}

        {/* Right Side - Project Workspace and Step Editor */}
        <div className="flex-1 p-6 pb-8 overflow-hidden h-full">
          <div className="h-full flex flex-col">
            <div className={cn(
              "transition-all duration-300 ease-in-out",
              isWorkspaceVisible 
                ? "flex-1 opacity-100 transform translate-y-0" 
                : "h-0 opacity-0 transform -translate-y-4 pointer-events-none overflow-hidden"
            )}>
              <ProjectWorkspace onStepSelect={setSelectedStep} />
              {selectedStep && <div className={cn(
                "mt-4 transition-all duration-300 ease-in-out",
                selectedStep ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-4"
              )}>
                <ComponentSelector
                  API_URL={config.API_URL}
                  selectedComponents={selectedComponents} 
                  onComponentSelect={(path) => setSelectedComponents(prev => [...prev, path])}
                  onComponentRemove={(path) => setSelectedComponents(prev => prev.filter(p => p !== path))}
                />
              </div>}
            </div>
            {selectedStep && selectedComponents.length > 0 && (
              <div className={cn(
                "relative transition-all duration-300 ease-in-out",
                selectedStep && selectedComponents.length > 0
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-4"
              )}>
                <div className="absolute left-1/2 transform -translate-x-1/2 -top-3 z-10">
                  <button
                    className="p-1.5 rounded-full bg-background border shadow-lg hover:bg-muted transition-colors"
                    onClick={() => setIsWorkspaceVisible(!isWorkspaceVisible)}
                  >
                    <ChevronLeft 
                      className={cn(
                        "h-4 w-4 transform transition-transform",
                        isWorkspaceVisible ? "-rotate-90" : "rotate-90"
                      )}
                    />
                  </button>
                </div>
                <div className="px-8 h-[calc(100vh-12rem)] overflow-hidden mt-8">
                  <div className="h-full">
                    <StepEditor 
                      API_URL={config.API_URL}
                      selectedComponents={selectedComponents}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isAIAgentOnRight && (
          <div className={cn("relative transition-all duration-300 ease-in-out h-full",
            isAIAgentCollapsed ? "w-0" : "w-[400px]")}>
            <div className={cn("absolute inset-0 p-6 pb-8 transition-all duration-300",
              isAIAgentCollapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
              <div className="h-full rounded-lg shadow-2xl overflow-hidden border-2 border-blue-200/30 dark:border-gray-700 bg-background">
                <AIAgent />
              </div>
            </div>
            <ChevronLeft 
              className={cn(
                "absolute top-1/2 -translate-y-1/2 h-4 w-4 cursor-pointer text-white hover:text-white/80 transition-all duration-200 z-50",
                isAIAgentCollapsed ? "-left-8" : "-left-3",
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