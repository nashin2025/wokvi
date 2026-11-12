import { useState } from 'react';
import { useProjectStore, useUIStore } from '../store';
import { Canvas } from '../components/Canvas';
import { CodeEditor } from '../components/CodeEditor';
import { SchematicView } from '../components/SchematicView';
import { BreadboardView } from '../components/BreadboardView';
import { ThreeDView } from '../components/ThreeDView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { LayoutDashboard, GitBranch, Code2, Box, Monitor, Settings, Layers } from 'lucide-react';
import { cn } from '../utils/cn';

export function ProMode() {
  const { currentProject, mode, setMode } = useProjectStore();
  const { sidebarOpen, rightPanelOpen, bottomPanelOpen, setSidebarOpen, setRightPanelOpen, setBottomPanelOpen } = useUIStore();
  const [activeView, setActiveView] = useState<'canvas' | 'schematic' | 'breadboard' | '3d' | 'code'>('canvas');

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-surface-500">No project loaded</p>
          <button onClick={() => setMode('magic')} className="btn-primary mt-4">
            Create New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* View Tabs */}
      <div className="border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 px-4">
        <Tabs defaultValue={activeView} onValueChange={setActiveView} className="w-full max-w-4xl mx-auto">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="canvas">
              <LayoutDashboard className="h-4 w-4 mr-1" />
              Canvas
            </TabsTrigger>
            <TabsTrigger value="schematic">
              <GitBranch className="h-4 w-4 mr-1" />
              Schematic
            </TabsTrigger>
            <TabsTrigger value="breadboard">
              <Box className="h-4 w-4 mr-1" />
              Breadboard
            </TabsTrigger>
            <TabsTrigger value="3d">
              <Monitor className="h-4 w-4 mr-1" />
              3D View
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code2 className="h-4 w-4 mr-1" />
              Code
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Canvas/Editor */}
        <div className={cn('flex-1 flex flex-col', sidebarOpen ? 'lg:pl-0' : '')}>
          <div className="flex-1 relative overflow-hidden">
            {activeView === 'canvas' && <Canvas />}
            {activeView === 'schematic' && <SchematicView />}
            {activeView === 'breadboard' && <BreadboardView />}
            {activeView === '3d' && <ThreeDView />}
            {activeView === 'code' && <CodeEditor />}
          </div>
        </div>
      </div>
    </div>
  );
}