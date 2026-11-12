import { useProjectStore, useSimulationStore, useUIStore } from '../store';
import {
  Play,
  Pause,
  Stop,
  RotateCcw,
  Download,
  Save,
  Settings,
  LayoutDashboard,
  Zap,
  Bug,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelRight,
  PanelBottom,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useModeStore } from '../store/modeStore';

export function Toolbar() {
  const { mode, setMode } = useProjectStore();
  const { state: simState, setState: setSimState, reset: resetSim } = useSimulationStore();
  const { setSidebarOpen, setRightPanelOpen, setBottomPanelOpen, toggleSidebar, toggleRightPanel, toggleBottomPanel, sidebarOpen, rightPanelOpen, bottomPanelOpen, theme, setTheme } = useUIStore();

  const handleRun = () => {
    if (simState.status === 'running') {
      setSimState({ status: 'paused' });
    } else if (simState.status === 'paused') {
      setSimState({ status: 'running' });
    } else {
      setSimState({ status: 'running', currentTime: 0 });
      // TODO: Start WASM simulation
    }
  };

  const handleStop = () => {
    resetSim();
    setSimState({ status: 'stopped' });
  };

  const handleRestart = () => {
    resetSim();
    setSimState({ status: 'running', currentTime: 0 });
  };

  const modeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    magic: { label: 'Magic', icon: <Zap className="h-4 w-4" /> },
    guided: { label: 'Guided', icon: <LayoutDashboard className="h-4 w-4" /> },
    pro: { label: 'Pro', icon: <Monitor className="h-4 w-4" /> },
  };

  return (
    <div className="flex h-12 items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950 px-4">
      {/* Left: Logo & Mode Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-surface-900 dark:text-surface-100 hidden sm:block">
            Wokvi
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 p-1 hidden md:flex">
          {(['magic', 'guided', 'pro'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150',
                mode === m
                  ? 'bg-white dark:bg-surface-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              )}
              title={modeLabels[m].label}
            >
              {modeLabels[m].icon}
              <span className="hidden sm:inline">{modeLabels[m].label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Simulation Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRestart}
          className="toolbar-btn"
          title="Restart Simulation (Ctrl+Shift+R)"
          disabled={simState.status === 'stopped'}
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          onClick={handleRun}
          className={cn(
            'toolbar-btn h-10 w-10 rounded-xl',
            simState.status === 'running'
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          )}
          title={simState.status === 'running' ? 'Pause (Space)' : 'Run Simulation (Space)'}
        >
          {simState.status === 'running' ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        <button
          onClick={handleStop}
          className="toolbar-btn"
          title="Stop Simulation (Shift+Space)"
          disabled={simState.status === 'stopped'}
        >
          <Stop className="h-5 w-5" />
        </button>

        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-2" />

        <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
          <span>{simState.status.toUpperCase()}</span>
          {simState.status === 'running' && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>T+{simState.currentTime.toFixed(1)}ms</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions & Panels */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 p-1 hidden sm:flex">
          <button
            onClick={toggleSidebar}
            className={cn('toolbar-btn', sidebarOpen && 'toolbar-btn-active')}
            title="Toggle Sidebar (Ctrl+B)"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <button
            onClick={toggleRightPanel}
            className={cn('toolbar-btn', rightPanelOpen && 'toolbar-btn-active')}
            title="Toggle Right Panel (Ctrl+Shift+B)"
          >
            <PanelRight className="h-5 w-5" />
          </button>
          <button
            onClick={toggleBottomPanel}
            className={cn('toolbar-btn', bottomPanelOpen && 'toolbar-btn-active')}
            title="Toggle Bottom Panel (Ctrl+J)"
          >
            <PanelBottom className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="toolbar-btn" title="Save Project (Ctrl+S)">
            <Save className="h-5 w-5" />
          </button>
          <button className="toolbar-btn" title="Export Project">
            <Download className="h-5 w-5" />
          </button>
          <button className="toolbar-btn" title="Settings">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-2 hidden md:block" />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="toolbar-btn"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* AI Chat Toggle */}
        <button
          onClick={() => useUIStore.getState().setActiveBottomTab('ai')}
          className={cn('toolbar-btn relative', useUIStore.getState().activeBottomTab === 'ai' && 'toolbar-btn-active')}
          title="AI Assistant (Ctrl+L)"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
            AI
          </span>
        </button>
      </div>
    </div>
  );
}