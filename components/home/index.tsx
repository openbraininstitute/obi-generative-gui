"use client";

// Core React hooks for state management and side effects
import { useState, useEffect } from "react"; 

// UI components and icons
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label"; 
import { Switch } from "@/components/ui/switch";

// Workspace components for different views
import { LibraryWorkspace } from "@/components/library-workspace";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectWorkspace } from "@/components/project-workspace";
import { PaperWorkspace } from "@/components/paper-workspace";
import { ComponentSelector } from "@/components/component-selector";
import { LabsProjectsView } from "@/components/labs-projects";
import { AIAgent } from "@/components/ai-agent";
import { StepEditor } from "@/components/step-editor";
import { ExploreWindow } from "@/components/explore-window";
import { cn } from "@/lib/utils";
import { PublicRuntimeConfig } from "@/lib/config.server";
import { OpenAPIV3 } from "openapi-types";
import { fetchOpenAPISpec } from "@/lib/api-client";

/**
 * Main home component that serves as the application's root layout
 * Manages the overall application state and view switching
 */
export default function HomeComponent({ config }: { config: PublicRuntimeConfig }) {
  // State for workflow and step management
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<Array<{ path: string; name: string }>>([]);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [isAddingComponent, setIsAddingComponent] = useState(false);

  // UI visibility states
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(true);
  const [isStepEditorVisible, setIsStepEditorVisible] = useState(true);
  const [isAIAgentCollapsed, setIsAIAgentCollapsed] = useState(false);
  const [isAIAgentOnRight, setIsAIAgentOnRight] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [isCNSMode, setIsCNSMode] = useState(false);
  const [selectedModelingLevel, setSelectedModelingLevel] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedStepType, setSelectedStepType] = useState('');

  // View selection and API state
  const [selectedView, setSelectedView] = useState("workspace");
  const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first component when components are added
  useEffect(() => {
    if (selectedComponents.length > 0 && !activeComponent && !isAddingComponent) {
      setActiveComponent(selectedComponents[0].path);
    }
  }, [selectedComponents, activeComponent, isAddingComponent]);

  // Fetch OpenAPI specification on component mount
  useEffect(() => {
    fetchOpenAPISpec(config.API_URL).then(spec => {
      setSpec(spec);
      setError(null);
    }).catch(error => {
      setError(error instanceof Error ? error.message : 'Failed to fetch OpenAPI spec');
      setSpec(null);
    });
  }, [config.API_URL]);

  useEffect(() => {
    if (isCNSMode) {
      // First select the workflow path
      setSelectedView('workspace');
      setSelectedStep('Circuit Activity');
      
      // Clear existing components and select SimulationsForm
      setTimeout(() => {
        setSelectedComponents([{
          path: '/SimulationsForm',
          name: 'Simulations'
        }]);
        setActiveComponent('/generated/simulations-generate-grid');
        setIsWorkspaceVisible(false);
        setIsAIAgentCollapsed(true);
      }, 100);
    } else {
      setIsWorkspaceVisible(true);
      setSelectedComponents([]);
      setActiveComponent(null);
      setIsAIAgentCollapsed(false);
    }
  }, [isCNSMode]);

  return (
    <div className="h-screen flex flex-col">
      {/* Top navigation bar */}
      {/* Top Bar */}
      <header className="bg-[#002B69] p-4 flex items-center justify-between border-b border-blue-900">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-semibold text-lg">Open Brain Platform</h1>
        </div>
        {/* View selector and theme toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="cns-mode" className="text-white">CNS</Label>
            <Switch
              id="cns-mode"
              checked={isCNSMode}
              onCheckedChange={setIsCNSMode}
              className="data-[state=checked]:bg-blue-400"
            />
          </div>
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-[140px] bg-[#003A8C] border-blue-800 text-white">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="workspace">Workspace</SelectItem>
              <SelectItem value="explore">Explore</SelectItem>
              <SelectItem value="labs">Labs/Projects</SelectItem>
              <SelectItem value="paper">Paper</SelectItem>
              <SelectItem value="library">Library</SelectItem>
            </SelectContent>
          </Select>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content area with AI agent and workspace */}
      {/* Main Content Area */}
      <div className="flex-1 bg-[#002766] flex overflow-hidden pt-8">
        {/* Left-side AI agent panel */}
        {!isAIAgentOnRight && (
          <div className={cn("relative transition-all duration-300 ease-in-out h-full",
            isAIAgentCollapsed ? "w-0" : "w-[400px]"
          )}>
            <div className={cn("absolute inset-0 p-6 transition-all duration-300",
              isAIAgentCollapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
              <div className="h-full rounded-lg shadow-2xl overflow-hidden border-2 border-blue-200/30 dark:border-gray-700 bg-background">
                <AIAgent 
                  onExplore={(explore = true) => setIsExploring(explore)}
                  isAIAgentOnRight={isAIAgentOnRight}
                  onPositionChange={setIsAIAgentOnRight}
                />
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

        {/* Central workspace area */}
        {/* Right Side - Project Workspace and Step Editor */}
        <div className="flex-1 relative overflow-hidden">
          {/* Main workspace content with transition animations */}
          <div className={cn(
            "absolute inset-0 transition-transform duration-500 ease-in-out",
            isExploring ? "translate-x-full pointer-events-none" : "translate-x-0"
          )}>
            <div className="h-full flex flex-col">
              <div className={cn(
                "transition-all duration-300 ease-in-out",
                isWorkspaceVisible 
                  ? "flex-0 opacity-100 mb-1" 
                  : "h-0 opacity-0 pointer-events-none overflow-hidden"
              )}>
                {selectedView === "workspace" ? (
                  <ProjectWorkspace onStepSelect={setSelectedStep} />
                ) : selectedView === "paper" ? (
                  <PaperWorkspace onSectionSelect={setSelectedStep} />
                ) : selectedView === "explore" ? (
                  <ExploreWindow />
                ) : selectedView === "labs" ? (
                  <LabsProjectsView />
                ) : (
                  <LibraryWorkspace />
                )}
                {selectedStep && selectedView === "workspace" && <div className={cn(
                  "mt-2 transition-all duration-300 ease-in-out space-y-1",
                  selectedStep ? "opacity-100 transform translate-y-0" : "opacity-0 transform -translate-y-4"
                )}>
                  <h2 className="text-sm text-[#40A9FF] font-medium px-8">WORKFLOW STEPS</h2>
                  <ComponentSelector
                    API_URL={config.API_URL}
                    spec={spec}
                    selectedComponents={selectedComponents} 
                    activeComponent={activeComponent}
                    onComponentSelect={(path) => {
                      const type = path.slice(1).replace(/Form$/, '');
                      const count = selectedComponents.filter(c => 
                        c.path.slice(1).replace(/Form$/, '') === type
                      ).length;
                      setIsAddingComponent(false);
                      setActiveComponent(path);
                      setSelectedComponents(prev => [...prev, {
                        path,
                        name: spec?.paths[path]?.post?.summary ? `${spec.paths[path].post.summary} ${count}` : `${type} ${count}`
                      }]);
                      setIsStepEditorVisible(true);
                    }}
                    onActiveComponentChange={(path: string | null) => {
                      setActiveComponent(path || null);
                      setIsStepEditorVisible(!!path);
                    }}
                    onComponentRemove={(path) => {
                      if (path === activeComponent) {
                        const nextComponent = selectedComponents.find(c => c.path !== path);
                        setActiveComponent(nextComponent?.path || null);
                      }
                      setSelectedComponents(prev => prev.filter(c => c.path !== path));
                    }}
                    onComponentRename={(path, newName) => {
                      setSelectedComponents(prev => prev.map(c => 
                        c.path === path ? { ...c, name: newName } : c
                      ));
                    }}
                    onAddComponentClick={() => {
                      setIsStepEditorVisible(false);
                      setIsAddingComponent(true);
                      setActiveComponent(null);
                    }}
                    selectedComponents={selectedComponents}
                    isCNSMode={isCNSMode}
                  />
                </div>}
              </div>
              {selectedStep && selectedComponents.length > 0 && selectedView === "workspace" && (
                <div className={cn(
                  "relative transition-all duration-300 ease-in-out",
                  selectedStep && selectedComponents.length > 0 && isStepEditorVisible
                    ? "opacity-100"
                    : "opacity-0"
                )}>
                  <div className="absolute left-1/2 transform -translate-x-1/2 top-2 z-10">
                    <button
                      className="p-1.5 text-white hover:text-white/80 transition-colors"
                      onClick={() => setIsWorkspaceVisible(prev => !prev)}
                    >
                      <ChevronLeft 
                        className={cn(
                          "h-4 w-4 transform transition-transform",
                          isWorkspaceVisible ? "rotate-90" : "-rotate-90"
                        )}
                      />
                    </button>
                  </div>
                  <div className={cn(
                    "px-8 overflow-hidden space-y-2",
                    isWorkspaceVisible 
                      ? "h-[calc(100vh-20rem)]"
                      : "h-[calc(100vh-8rem)]"
                  )}>
                    <h2 className="text-sm text-[#40A9FF] font-medium">STEP</h2>
                    <div className="h-[calc(100%-1.75rem)]">
                      <StepEditor 
                        API_URL={config.API_URL}
                        activeComponent={activeComponent || selectedComponents[0]?.path || null}
                        selectedComponents={selectedComponents}
                        isCNSMode={isCNSMode}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            "absolute inset-0 transition-transform duration-500 ease-in-out",
            !isExploring ? "-translate-x-full pointer-events-none" : "translate-x-0"
          )}>
            <ExploreWindow />
          </div>
        </div>

        {/* Right-side AI agent panel (when enabled) */}
        {isAIAgentOnRight && (
          <div className={cn("relative transition-all duration-300 ease-in-out h-full",
            isAIAgentCollapsed ? "w-0" : "w-[400px]")}>
            <div className={cn("absolute inset-0 p-6 transition-all duration-300",
              isAIAgentCollapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
              <div className="h-full rounded-lg shadow-2xl overflow-hidden border-2 border-blue-200/30 dark:border-gray-700 bg-background">
                <AIAgent 
                  onExplore={(explore = true) => setIsExploring(explore)}
                  isAIAgentOnRight={isAIAgentOnRight}
                  onPositionChange={setIsAIAgentOnRight}
                />
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