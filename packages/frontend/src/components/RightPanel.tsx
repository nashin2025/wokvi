import { useUIStore } from '../store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { X, Settings, Layers, Code, Bug, MessageSquare } from 'lucide-react';
import { cn } from '../utils/cn';

export function RightPanel() {
  const { rightPanelOpen, setRightPanelOpen, activeBottomTab } = useUIStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-surface-200 dark:border-surface-700">
        <h2 className="font-medium text-surface-900 dark:text-surface-100">Properties</h2>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="toolbar-btn"
          title="Close Panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="properties">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="layers">
              <Layers className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="debug">
              <Bug className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-4">
            <PropertyInspector />
          </TabsContent>

          <TabsContent value="layers" className="mt-4">
            <LayerManager />
          </TabsContent>

          <TabsContent value="code" className="mt-4">
            <CodeInspector />
          </TabsContent>

          <TabsContent value="debug" className="mt-4">
            <DebugInspector />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function PropertyInspector() {
  const { currentProject, updateComponent } = useUIStore.getState() as any;
  // TODO: Connect to actual selected component
  const selectedComponent = currentProject?.components[0];

  if (!selectedComponent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-surface-500 dark:text-surface-400">
        <span className="text-sm">Select a component to view properties</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-2">
          {selectedComponent.componentId}
        </h3>
        <div className="space-y-2">
          <PropertyField label="Position X" value={selectedComponent.position.x} unit="px" />
          <PropertyField label="Position Y" value={selectedComponent.position.y} unit="px" />
          <PropertyField label="Rotation" value={selectedComponent.rotation} unit="°" />
        </div>
      </div>
    </div>
  );
}

function PropertyField({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="grid grid-cols-[1fr_80px] gap-2 items-center">
      <label className="text-sm text-surface-600 dark:text-surface-400">{label}</label>
      <input
        type="number"
        value={value}
        className="input text-right"
        readOnly
      />
      {unit && <span className="text-sm text-surface-500 dark:text-surface-400">{unit}</span>}
    </div>
  );
}

function LayerManager() {
  return (
    <div className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
      <p>Layer management coming soon...</p>
    </div>
  );
}

function CodeInspector() {
  return (
    <div className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
      <p>Code inspection coming soon...</p>
    </div>
  );
}

function DebugInspector() {
  return (
    <div className="space-y-2 text-sm text-surface-600 dark:text-surface-400">
      <p>Debug inspector coming soon...</p>
    </div>
  );
}