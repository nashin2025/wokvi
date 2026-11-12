import { useState } from 'react';
import { useProjectStore, useUIStore } from '../store';
import { Zap, Loader2, AlertCircle, CheckCircle, FileText, Code, LayoutDashboard, Monitor, ArrowRight } from 'lucide-react';
import { cn } from '../utils/cn';

export function MagicMode() {
  const { mode, setMode, currentProject, setCurrentProject, resetProject } = useProjectStore();
  const { setBottomPanelOpen, setActiveBottomTab } = useUIStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProject, setGeneratedProject] = useState<typeof currentProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // TODO: Call AI Project Generator API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock generated project
      const project = {
        id: crypto.randomUUID(),
        name: 'Generated Project',
        description: prompt,
        mode: 'magic' as const,
        board: 'esp32-devkit',
        components: [],
        wires: [],
        code: `// Generated from: "${prompt}"\n\nvoid setup() {\n  Serial.begin(115200);\n  // TODO: Initialize components\n}\n\nvoid loop() {\n  // TODO: Main logic\n  delay(100);\n}`,
        simulationConfig: {
          board: 'esp32-devkit',
          frequency: 240_000_000,
          peripherals: [],
          virtualSensors: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: '',
        collaborators: [],
        isPublic: false,
        tags: ['ai-generated'],
      };

      setGeneratedProject(project);
      setCurrentProject(project);
      setBottomPanelOpen(true);
      setActiveBottomTab('terminal');
    } catch (err) {
      setError('Failed to generate project. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseProject = () => {
    if (generatedProject) {
      setCurrentProject(generatedProject);
      setGeneratedProject(null);
      setPrompt('');
    }
  };

  const handleNewPrompt = () => {
    resetProject();
    setGeneratedProject(null);
    setPrompt('');
  };

  const examplePrompts = [
    'Weather station with BME280 sensor and OLED display',
    'Smart plant watering system with soil moisture sensor',
    'Bluetooth-controlled LED strip with ESP32',
    'Temperature and humidity logger with SD card',
    'Motion-activated security camera with PIR sensor',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 mb-6">
            <Zap className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-4xl font-bold text-surface-900 dark:text-surface-100 mb-4">
            Describe Your Project
          </h1>
          <p className="text-lg text-surface-600 dark:text-surface-400">
            Tell us what you want to build in plain English. Our AI will generate the schematic,
            firmware, and simulation configuration instantly.
          </p>
        </div>

        {/* Generated Project Preview */}
        {generatedProject && (
          <div className="mb-8 p-6 card border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 animate-slide-up">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Project Generated Successfully
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  {generatedProject.description}
                </p>
              </div>
              <button
                onClick={handleNewPrompt}
                className="btn-ghost text-sm"
              >
                Generate Another
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={handleUseProject} className="btn-primary flex-1">
                <ArrowRight className="h-4 w-4 mr-2" />
                Open in Simulator
              </button>
              <button className="btn-secondary">
                <Code className="h-4 w-4 mr-2" />
                View Code
              </button>
              <button className="btn-secondary">
                <FileText className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="card p-6 mb-8">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder='e.g., "Weather station with BME280 sensor and OLED display that sends data to MQTT"'
              rows={4}
              className="w-full px-4 py-4 text-lg border-2 border-surface-200 dark:border-surface-700 rounded-xl bg-white dark:bg-surface-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none font-medium"
              disabled={isGenerating}
            />
            {isGenerating && (
              <div className="absolute inset-0 bg-white/80 dark:bg-surface-950/80 rounded-xl flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  <span className="text-lg font-medium text-surface-700 dark:text-surface-300">
                    AI is designing your project...
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="btn-primary px-8 py-3 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate & Run
                </>
              )}
            </button>
            <div className="flex items-center gap-4 text-sm text-surface-500">
              <span>Shortcuts: Enter to generate, Shift+Enter for new line</span>
            </div>
          </div>
        </div>

        {/* Example Prompts */}
        <div>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-4 text-center">
            Try one of these examples:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {examplePrompts.map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="card p-4 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
              >
                <p className="text-sm text-surface-700 dark:text-surface-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {example}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500 dark:text-surface-400 text-center mb-4">
            Or choose a different mode:
          </p>
          <div className="grid grid-cols-3 gap-4">
            {([
              { key: 'magic', icon: Zap, label: 'Magic', desc: 'AI generates everything' },
              { key: 'guided', icon: LayoutDashboard, label: 'Guided', desc: 'Step-by-step wizard' },
              { key: 'pro', icon: Monitor, label: 'Pro', desc: 'Full control & tools' },
            ] as const).map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => setMode(key as 'magic' | 'guided' | 'pro')}
                className={cn(
                  'card p-6 text-left transition-all hover:border-primary-300 dark:hover:border-primary-700',
                  mode === key && 'border-primary-500 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-surface-900 dark:text-surface-100">{label} Mode</h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}