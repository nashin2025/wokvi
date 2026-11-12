import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useUIStore, useProjectStore, useUserStore } from '../store';
import { Toolbar } from './Toolbar';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { BottomPanel } from './BottomPanel';
import { ModeSelector } from './ModeSelector';
import { cn } from '../utils/cn';

export function Layout() {
  const location = useLocation();
  const { sidebarOpen, rightPanelOpen, bottomPanelOpen, theme } = useUIStore();
  const { mode } = useProjectStore();
  const { user } = useUserStore();

  const isAuthPage = location.pathname === '/login';

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className={cn('flex h-screen w-screen overflow-hidden', `theme-${theme}`)}>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={cn(
            'flex flex-col transition-all duration-300 ease-out z-20',
            sidebarOpen ? 'w-72' : 'w-16',
            'border-r border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950'
          )}
        >
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Toolbar */}
          <header className="flex-shrink-0 z-10">
            <Toolbar />
          </header>

          {/* Canvas/Editor Area */}
          <div className="flex-1 flex overflow-hidden relative">
            <Outlet />
          </div>

          {/* Bottom Panel */}
          {bottomPanelOpen && (
            <div
              className={cn(
                'transition-all duration-300 ease-out border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950',
                'h-64'
              )}
            >
              <BottomPanel />
            </div>
          )}
        </main>

        {/* Right Panel */}
        {rightPanelOpen && (
          <aside
            className={cn(
              'flex flex-col transition-all duration-300 ease-out z-20 w-80',
              'border-l border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950'
            )}
          >
            <RightPanel />
          </aside>
        )}
      </div>

      {/* Mode Selector (Mobile) */}
      <ModeSelector />
    </div>
  );
}