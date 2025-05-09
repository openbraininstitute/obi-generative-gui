"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lab {
  name: string;
  lastUpdate: string;
  projectCount: number;
  memberCount: number;
}

const MOCK_LABS: Lab[] = [
  {
    name: "James' Lab",
    lastUpdate: "2 months ago",
    projectCount: 3,
    memberCount: 1
  },
  {
    name: "Neural Circuits Lab",
    lastUpdate: "1 week ago",
    projectCount: 5,
    memberCount: 3
  },
  {
    name: "Computational Neuroscience Lab",
    lastUpdate: "3 days ago",
    projectCount: 7,
    memberCount: 4
  }
];

export function LabsProjectsView() {
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);

  return (
    <div className="h-[calc(100%-3rem)] bg-background rounded-lg shadow-2xl border-2 border-blue-200/30 dark:border-gray-700 mx-6 mt-6">
      <div className="h-full p-6 space-y-6">
        {!selectedLab ? (
          <>
            <h2 className="text-2xl font-semibold">Labs</h2>
            <div className="grid gap-4">
              {MOCK_LABS.map((lab) => (
                <button
                  key={lab.name}
                  className="flex items-center justify-between p-6 bg-card hover:bg-muted/50 rounded-lg border transition-colors text-left group"
                  onClick={() => setSelectedLab(lab)}
                >
                  <div>
                    <h3 className="text-xl font-semibold">{lab.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Virtual lab's latest update: {lab.lastUpdate}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span>Projects: {lab.projectCount}</span>
                      <span>Members: {lab.memberCount}</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <ProjectView lab={selectedLab} onBack={() => setSelectedLab(null)} />
        )}
      </div>
    </div>
  );
}

interface ProjectViewProps {
  lab: Lab;
  onBack: () => void;
}

function ProjectView({ lab, onBack }: ProjectViewProps) {
  return (
    <div className="h-full flex">
      {/* Left Sidebar */}
      <div className="w-[280px] border-r pr-6">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          ← Back to Labs
        </button>
        <nav className="space-y-1">
          {[
            "Project Home",
            "Project Library",
            "Project Team",
            "Activity",
            "Notebooks",
            "Explore",
            "Build",
            "Experiment",
            "Project papers",
            "Admin"
          ].map((item, i) => (
            <button
              key={item}
              className={cn(
                "flex items-center justify-between w-full px-4 py-2 text-sm rounded-md transition-colors",
                i === 0 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {item}
              {i === 3 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">19</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 pl-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{lab.name}</h1>
            <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Members:</span>
                <span className="font-medium text-foreground">{lab.memberCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Admin:</span>
                <span className="font-medium text-foreground">James Isbister</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Creation date:</span>
                <span className="font-medium text-foreground">09-05-2025</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Credit balance:</span>
                <span className="font-medium text-foreground">0.00</span>
              </div>
            </div>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
            Go to virtual lab →
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">MEMBERS</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-semibold">
              JI
            </div>
            <div>
              <div className="font-medium">James Isbister</div>
              <div className="text-sm text-muted-foreground">Admin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}