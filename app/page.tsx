"use client";

import { useState } from "react";
import { LayoutTemplate } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectWorkspace } from "@/components/project-workspace";
import { ChatAgent } from "@/components/chat-agent";
import { StepEditorViewer } from "@/components/step-editor-viewer";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

export default function Home() {
  const [selectedTask, setSelectedTask] = useState("a");
  const [editorOnRight, setEditorOnRight] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      <ProjectWorkspace />
      
      <div className="flex-1 bg-[#002766]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* AI Agent Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
            <div className="h-full p-4">
              <div className="h-full rounded-lg overflow-hidden shadow-lg">
                <ChatAgent />
              </div>
            </div>
          </ResizablePanel>

          {/* Workspace and Experiment Designer Panel */}
          <ResizablePanel defaultSize={75}>
            <div className="h-full p-4">
              <div className="h-full rounded-lg border shadow-lg bg-background overflow-hidden">
                <div className="flex-none px-6 py-4 border-b">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Label>Task:</Label>
                      <div className="w-[100px]">
                        <Select
                          value={selectedTask}
                          onValueChange={setSelectedTask}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a">A</SelectItem>
                            <SelectItem value="b">B</SelectItem>
                            <SelectItem value="c">C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                        <Switch
                          checked={editorOnRight}
                          onCheckedChange={setEditorOnRight}
                          size="sm"
                        />
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                <div className="flex-1 h-[calc(100%-4rem)]">
                  <StepEditorViewer />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}