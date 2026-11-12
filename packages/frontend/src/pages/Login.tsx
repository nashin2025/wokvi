import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store';
import { Zap, Mail, Lock, User, Github, Chrome } from 'lucide-react';
import { cn } from '../utils/cn';

export function Login() {
  const navigate = useNavigate();
  const { setUser } = useUserStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TODO: Call auth API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = {
        id: crypto.randomUUID(),
        email,
        name: name || email.split('@')[0],
        role: 'user' as const,
        preferences: {
          theme: 'system' as const,
          mode: 'magic' as const,
          autoSave: true,
          showTips: true,
          keyboardShortcuts: true,
        },
        createdAt: new Date(),
      };

      setUser(user);
      navigate('/');
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'github' | 'google') => {
    // TODO: Implement OAuth
    console.log(`OAuth with ${provider}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-surface-600 dark:text-surface-400 mt-2">
            {isLogin
              ? 'Sign in to continue building embedded projects'
              : 'Start building AI-powered embedded projects in minutes'}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Github className="h-5 w-5" />
            GitHub
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Chrome className="h-5 w-5" />
            Google
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-200 dark:border-surface-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-surface-50 dark:bg-surface-950 px-4 text-surface-500">
              or continue with email
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-9"
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-9"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-9"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Switch Mode */}
        <p className="text-center text-sm text-surface-600 dark:text-surface-400 mt-6">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="ml-2 text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
            <Zap className="h-6 w-6 text-primary-600 dark:text-primary-400 mx-auto mb-1" />
            <p className="text-xs text-surface-600 dark:text-surface-400">AI Generation</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-1">
              <span className="text-xs text-white">✓</span>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-400">Simulation</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1">
              <span className="text-xs text-white">👥</span>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-400">Collaboration</p>
          </div>
        </div>
      </div>
    </div>
  );
}