'use client';

import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../store';
import { cn } from '../utils/cn';

export function CodeEditor() {
  const { currentProject, setCode } = useProjectStore();
  const [editor, setEditor] = useState<any>(null);
  const [language, setLanguage] = useState<'cpp' | 'python' | 'rust'>('cpp');

  const handleEditorMount = (editorInstance: any, monaco: any) => {
    setEditor(editorInstance);
    
    // Configure editor
    editorInstance.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      folding: true,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true },
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on',
    });

    // Set initial code
    if (currentProject?.code) {
      editorInstance.setValue(currentProject.code);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const getLanguageId = () => {
    switch (language) {
      case 'cpp': return 'cpp';
      case 'python': return 'python';
      case 'rust': return 'rust';
      default: return 'cpp';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-950">
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'cpp' | 'python' | 'rust')}
            className="input py-1 px-2 text-sm w-auto"
          >
            <option value="cpp">C++ (Arduino/ESP-IDF)</option>
            <option value="python">MicroPython</option>
            <option value="rust">Rust (Embassy)</option>
          </select>
          
          <div className="flex items-center gap-1 ml-4">
            <button className="toolbar-btn" title="Format Code (Shift+Alt+F)">
              <span className="text-xs font-mono">{}</span>
            </button>
            <button className="toolbar-btn" title="Compile">
              <span className="text-xs font-medium">▶</span>
            </button>
            <button className="toolbar-btn" title="Upload to Board">
              <span className="text-xs">⬆</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-500 dark:text-surface-400">
            Ln 1, Col 1
          </span>
          <span className="text-xs text-surface-500 dark:text-surface-400">
            {currentProject?.code.split('\n').length || 0} lines
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={getLanguageId()}
          theme="vs-dark"
          value={currentProject?.code || ''}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            folding: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true },
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
}