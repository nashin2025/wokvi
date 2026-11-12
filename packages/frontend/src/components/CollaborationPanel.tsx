// Collaboration Panel - Shows connected users, allows inviting others

import { useUIStore, useProjectStore } from '../store';
import { Users, Link, X, Mail } from 'lucide-react';
import { cn } from '../utils/cn';

export function CollaborationPanel() {
  const { 
    collabConnected,
  } = useUIStore();
  const { currentProject } = useProjectStore();

  const handleInviteClick = () => {
    const url = `${window.location.origin}/project/${currentProject?.id}`;
    navigator.clipboard.writeText(url);
  };

  const connectedUsers = [
    { id: '1', name: 'You', color: '#3b82f6', online: true, cursor: { x: 100, y: 200 } },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-medium text-surface-900 dark:text-surface-100">
            Collaboration
          </h3>
          <span className={cn(
            'px-2 py-0.5 text-xs rounded-full',
            collabConnected 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {collabConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <button
          onClick={() => useUIStore.getState().setCollabOpen(false)}
          className="toolbar-btn"
          title="Close Panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Connection Status */}
      <div className="p-3 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
              Disconnected
            </p>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Click connect to enable real-time collaboration
            </p>
          </div>
          <button 
            className="btn-secondary text-sm"
            disabled={true}
          >
            Connect
          </button>
        </div>
      </div>

      {/* Connected Users */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300 px-2">
          Collaborators (1)
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-blue-500">
              Y
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                You
              </p>
              <p className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Section */}
      <div className="p-3 border-t border-surface-200 dark:border-surface-700 space-y-3">
        <h4 className="text-sm font-medium text-surface-700 dark:text-surface-300">
          Invite Collaborators
        </h4>
        
        <button 
          onClick={() => {
            const url = `${window.location.origin}/project/${useProjectStore.getState().currentProject?.id}`;
            navigator.clipboard.writeText(url);
          }}
          className="btn-secondary w-full justify-start gap-2"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          <span>Copy Project Link</span>
        </button>
        
        <button className="btn-secondary w-full justify-start gap-2">
          <Mail className="h-4 w-4" />
          <span>Invite via Email</span>
        </button>

        <div className="p-2 rounded bg-surface-100 dark:bg-surface-800 text-xs text-surface-600 dark:text-surface-400">
          <p className="font-medium mb-1">Permissions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Editor - Can edit components, wires, and code</li>
            <li>Viewer - Can only view and comment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}