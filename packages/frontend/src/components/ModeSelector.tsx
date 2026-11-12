'use client';

import { useEffect } from 'react';
import { useProjectStore, useModeStore } from '../store';
import { Zap, LayoutDashboard, Monitor, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

const modeConfig = {
  magic: { label: 'Magic', icon: Zap, description: 'AI generates everything from a prompt', color: 'purple' },
  guided: { label: 'Guided', icon: LayoutDashboard, description: 'Step-by-step wizard with AI assistance', color: 'blue' },
  pro: { label: 'Pro', icon: Monitor, description: 'Full control with advanced tools', color: 'green' },
};

export function ModeSelector() {
  const { mode, setMode } = useProjectStore();
  const { currentMode, setCurrentMode } = useModeStore();

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, setCurrentMode]);

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <div className="flex items-center gap-2 bg-white dark:bg-surface-900 rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 p-2">
        {Object.entries(modeConfig).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = currentMode === key;
          return (
            <button
              key={key}
              onClick={() => setMode(key as 'magic' | 'guided' | 'pro')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? `bg-${config.color}-100 text-${config.color}-700 dark:bg-${config.color}-900/30 dark:text-${config.color}-400`
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}