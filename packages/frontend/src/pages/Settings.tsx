import { useUserStore, useUIStore } from '../store';
import { User, Monitor, Palette, Keyboard, Save, Bell, Shield, Globe, Delete } from 'lucide-react';
import { cn } from '../utils/cn';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

export function Settings() {
  const { user, updatePreferences } = useUserStore();
  const { theme, setTheme } = useUIStore();
  const [preferences, setPreferences] = useState(user?.preferences || {
    theme: 'system',
    mode: 'magic',
    autoSave: true,
    showTips: true,
    keyboardShortcuts: true,
  });

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const handleSave = () => {
    updatePreferences(preferences);
    setTheme(preferences.theme);
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full p-6 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">Settings</h1>
        <p className="text-surface-600 dark:text-surface-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="general">
            <User className="h-4 w-4 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-1" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="editor">
            <Keyboard className="h-4 w-4 mr-1" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="account">
            <Shield className="h-4 w-4 mr-1" />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <section>
            <h2 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Profile</h2>
            <div className="card p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-surface-900 dark:text-surface-100">{user?.name}</h3>
                  <p className="text-sm text-surface-500">{user?.email}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Default Mode</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['magic', 'guided', 'pro'] as const).map((mode) => (
                <label key={mode} className={cn(
                  'card p-4 cursor-pointer transition-all border-2',
                  preferences.mode === mode
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:border-primary-300 dark:hover:border-primary-700'
                )}>
                  <input
                    type="radio"
                    name="defaultMode"
                    value={mode}
                    checked={preferences.mode === mode}
                    onChange={() => setPreferences({ ...preferences, mode })}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-2">
                      {mode === 'magic' && <span className="text-2xl">⚡</span>}
                      {mode === 'guided' && <span className="text-2xl">📋</span>}
                      {mode === 'pro' && <Monitor className="h-6 w-6 mx-auto text-primary-600 dark:text-primary-400" />}
                    </div>
                    <p className="font-medium capitalize">{mode}</p>
                    <p className="text-xs text-surface-500 mt-1">
                      {mode === 'magic' && 'AI generates everything'}
                      {mode === 'guided' && 'Step-by-step wizard'}
                      {mode === 'pro' && 'Full control'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 space-y-6">
          <section>
            <h2 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Theme</h2>
            <div className="grid grid-cols-3 gap-4">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <label key={t} className={cn(
                  'card p-4 cursor-pointer transition-all border-2 text-center',
                  preferences.theme === t
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:border-primary-300 dark:hover:border-primary-700'
                )}>
                  <input
                    type="radio"
                    name="theme"
                    value={t}
                    checked={preferences.theme === t}
                    onChange={() => {
                      setPreferences({ ...preferences, theme: t });
                      setTheme(t);
                    }}
                    className="sr-only"
                  />
                  <div className="text-3xl mb-2">
                    {t === 'light' && '☀️'}
                    {t === 'dark' && '🌙'}
                    {t === 'system' && '💻'}
                  </div>
                  <p className="font-medium capitalize">{t}</p>
                  <p className="text-xs text-surface-500 mt-1">
                    {t === 'light' && 'Always light mode'}
                    {t === 'dark' && 'Always dark mode'}
                    {t === 'system' && 'Follow system setting'}
                  </p>
                </label>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="editor" className="mt-6 space-y-6">
          <section>
            <h2 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Editor Preferences</h2>
            <div className="card p-4 space-y-4">
              <PreferenceToggle
                label="Auto-save"
                description="Automatically save changes to your project"
                checked={preferences.autoSave}
                onChange={(checked) => setPreferences({ ...preferences, autoSave: checked })}
              />
              <PreferenceToggle
                label="Show tips"
                description="Display helpful tips and hints in the interface"
                checked={preferences.showTips}
                onChange={(checked) => setPreferences({ ...preferences, showTips: checked })}
              />
              <PreferenceToggle
                label="Keyboard shortcuts"
                description="Enable keyboard shortcuts for common actions"
                checked={preferences.keyboardShortcuts}
                onChange={(checked) => setPreferences({ ...preferences, keyboardShortcuts: checked })}
              />
            </div>
          </section>

          <section>
            <h2 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Code Editor</h2>
            <div className="card p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Font Size
                </label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={14}
                  onChange={(e) => console.log(e.target.value)}
                  className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <p className="text-xs text-surface-500 mt-1 text-right">14px</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Tab Size
                </label>
                <select className="input w-auto" defaultValue="2">
                  <option value="2">2 spaces</option>
                  <option value="4">4 spaces</option>
                  <option value="tab">Tabs</option>
                </select>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="account" className="mt-6 space-y-6">
          <section>
            <h2 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Security</h2>
            <div className="card p-4 space-y-4">
              <button className="btn-secondary w-full justify-start">
                Change Password
              </button>
              <button className="btn-secondary w-full justify-start">
                Enable Two-Factor Authentication
              </button>
              <button className="btn-secondary w-full justify-start">
                Manage Sessions
              </button>
            </div>
          </section>

          <section>
            <h2 className="font-medium text-surface-900 dark:text-surface-100 mb-4">Danger Zone</h2>
            <div className="card p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 space-y-4">
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-300">Delete Account</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button className="btn-danger">
                <Delete className="h-4 w-4 mr-2" />
                Delete Account
              </button>
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button onClick={handleSave} className="btn-primary px-8 py-3">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <div>
        <p className="font-medium text-surface-900 dark:text-surface-100">{label}</p>
        <p className="text-sm text-surface-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  );
}