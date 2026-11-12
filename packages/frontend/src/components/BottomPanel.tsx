import { useUIStore, useSimulationStore } from '../store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Terminal, Bug, MessageSquare, X, Maximize2, Minimize2, Clear, Copy, Download } from 'lucide-react';
import { cn } from '../utils/cn';

export function BottomPanel() {
  const { activeBottomTab, setActiveBottomTab, bottomPanelOpen, setBottomPanelOpen } = useUIStore();
  const { state: simState } = useSimulationStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-200 dark:border-surface-700">
        <TabsList className="flex-1 justify-start">
          <TabsTrigger value="terminal">
            <Terminal className="h-4 w-4 mr-1" />
            Terminal
          </TabsTrigger>
          <TabsTrigger value="debug">
            <Bug className="h-4 w-4 mr-1" />
            Debug
          </TabsTrigger>
          <TabsTrigger value="console">
            <MessageSquare className="h-4 w-4 mr-1" />
            Console
          </TabsTrigger>
          <TabsTrigger value="ai">
            <MessageSquare className="h-4 w-4 mr-1" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-1">
          <button className="toolbar-btn" title="Clear">
            <Clear className="h-4 w-4" />
          </button>
          <button className="toolbar-btn" title="Copy">
            <Copy className="h-4 w-4" />
          </button>
          <button className="toolbar-btn" title="Download Log">
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setBottomPanelOpen(false)}
            className="toolbar-btn"
            title="Close Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TabsContent value="terminal" className="h-full">
          <TerminalPanel />
        </TabsContent>
        <TabsContent value="debug" className="h-full">
          <DebugPanel />
        </TabsContent>
        <TabsContent value="console" className="h-full">
          <ConsolePanel />
        </TabsContent>
        <TabsContent value="ai" className="h-full">
          <AIPanel />
        </TabsContent>
      </div>
    </div>
  );
}

function TerminalPanel() {
  const { state: simState } = useSimulationStore();

  return (
    <div className="flex flex-col h-full bg-surface-950 text-surface-100 font-mono text-sm p-3 overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
        {simState.serialOutput.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2',
              msg.direction === 'tx' ? 'text-green-400' : 'text-blue-400'
            )}
          >
            <span className="text-surface-500 whitespace-nowrap">
              [{new Date(msg.timestamp).toLocaleTimeString()}]
            </span>
            <span className="whitespace-pre-wrap break-all">{msg.data}</span>
          </div>
        ))}
        {simState.serialOutput.length === 0 && (
          <div className="text-surface-500 text-center py-8">
            Serial output will appear here when simulation runs...
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-surface-800">
        <span className="text-surface-500">$</span>
        <input
          type="text"
          className="flex-1 bg-transparent border-none outline-none text-surface-100 font-mono text-sm"
          placeholder="Type command..."
        />
      </div>
    </div>
  );
}

function DebugPanel() {
  const { state: simState } = useSimulationStore();

  return (
    <div className="flex flex-col h-full p-3 overflow-y-auto scrollbar-thin space-y-4">
      <div>
        <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-2">Registers</h3>
        <div className="grid grid-cols-4 gap-2 text-sm">
          {Object.entries(simState.registers).map(([name, value]) => (
            <div key={name} className="p-2 rounded bg-surface-100 dark:bg-surface-800">
              <div className="text-surface-500 dark:text-surface-400">{name}</div>
              <div className="font-mono text-surface-900 dark:text-surface-100">
                0x{value.toString(16).toUpperCase().padStart(8, '0')}
              </div>
            </div>
          ))}
          {Object.keys(simState.registers).length === 0 && (
            <div className="text-surface-500 col-span-4 text-center py-4">
              No register data (simulation not running)
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-2">Breakpoints</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {simState.breakpoints.map((bp) => (
            <div
              key={bp.id}
              className="flex items-center justify-between p-2 rounded bg-surface-100 dark:bg-surface-800"
            >
              <span className="font-mono text-sm">0x{bp.address.toString(16).toUpperCase().padStart(8, '0')}</span>
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  bp.enabled ? 'bg-green-500' : 'bg-surface-400'
                )}
              />
            </div>
          ))}
          {simState.breakpoints.length === 0 && (
            <div className="text-surface-500 text-center py-4 text-sm">
              No breakpoints set
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-surface-900 dark:text-surface-100 mb-2">GPIO State</h3>
        <div className="grid grid-cols-4 gap-1 text-sm max-h-40 overflow-y-auto">
          {Object.entries(simState.gpioState).map(([pin, state]) => (
            <div
              key={pin}
              className={cn(
                'p-2 rounded text-center font-mono',
                state
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {pin}: {state ? 'HIGH' : 'LOW'}
            </div>
          ))}
          {Object.keys(simState.gpioState).length === 0 && (
            <div className="text-surface-500 col-span-4 text-center py-4">
              No GPIO activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConsolePanel() {
  const { state: simState } = useSimulationStore();

  return (
    <div className="flex flex-col h-full p-3 overflow-y-auto scrollbar-thin space-y-2">
      {simState.errors.map((error) => (
        <div
          key={error.id}
          className={cn(
            'p-3 rounded-lg border text-sm',
            error.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
              : error.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
              : 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-300'
          )}
        >
          <div className="flex items-start gap-2">
            <span className="font-mono text-xs text-surface-500">
              [{new Date(error.timestamp).toLocaleTimeString()}]
            </span>
            <div className="flex-1">
              <div className="font-medium capitalize">{error.type}</div>
              <div>{error.message}</div>
              {error.componentId && (
                <div className="text-xs mt-1 text-surface-500">
                  Component: {error.componentId}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {simState.errors.length === 0 && (
        <div className="text-surface-500 text-center py-8">
          No errors or warnings
        </div>
      )}
    </div>
  );
}

function AIPanel() {
  const [messages, setMessages] = useUIStore((state) => state.aiMessages ?? []);
  const [input, setInput] = useUIStore((state) => state.aiInput ?? '');
  const [isLoading, setIsLoading] = useUIStore((state) => state.aiLoading ?? false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: 'user' as const, content: input, timestamp: new Date() };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);
    // TODO: Call AI API
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'assistant' as const, content: 'AI response coming soon...', timestamp: new Date() }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg: any, i: number) => (
          <div key={i} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-200 dark:bg-surface-700'
              )}
            >
              {msg.role === 'user' ? (
                <span className="text-xs font-bold">U</span>
              ) : (
                <span className="text-xs font-bold text-primary-600">AI</span>
              )}
            </div>
            <div
              className={cn(
                'max-w-[70%] p-3 rounded-2xl',
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-surface-100 dark:bg-surface-800 rounded-bl-none'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-8 text-surface-500">
            <p className="font-medium mb-1">AI Assistant</p>
            <p className="text-sm">Ask me anything about your project!</p>
          </div>
        )}
      </div>
      <div className="p-3 border-t border-surface-200 dark:border-surface-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 input"
            placeholder="Ask about your circuit, code, or simulation..."
            disabled={isLoading}
          />
          <button onClick={sendMessage} className="btn-primary" disabled={!input.trim() || isLoading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}