import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRoute } from '../hooks/useRBAC';
import { Zap, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';

const roles = ['FleetManager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'];
const roleLabels: Record<string, string> = {
  FleetManager: 'Fleet Manager',
  Dispatcher: 'Dispatcher',
  SafetyOfficer: 'Safety Officer',
  FinancialAnalyst: 'Financial Analyst',
};

const roleAccess = [
  { role: 'Fleet Manager', access: 'Fleet Registry, Maintenance, Analytics' },
  { role: 'Dispatcher', access: 'Dashboard, Trip Dispatcher' },
  { role: 'Safety Officer', access: 'Drivers, Safety Profiles, Trips (view)' },
  { role: 'Financial Analyst', access: 'Fuel & Expenses, Analytics' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FleetManager');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password, role);
      navigate(getDefaultRoute(role));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-dark-800 via-dark-700 to-dark-800 flex-col justify-between p-12 border-r border-dark-500 relative overflow-hidden">
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-amber/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-accent-amber flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">TransitOps</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-snug mb-4">
            Smart Transport<br />Operations Platform
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-10">
            One login, four roles — centralized control for your entire logistics operation.
          </p>

          <div className="space-y-3">
            {['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'].map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-accent-amber/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-accent-amber" />
                </div>
                <span className="text-gray-300 text-sm">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role access footer */}
        <div className="relative">
          <div className="border-t border-dark-500 pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Role Access Guide</p>
            <div className="space-y-2">
              {roleAccess.map(({ role, access }) => (
                <div key={role} className="flex gap-3">
                  <span className="text-accent-amber text-xs font-semibold min-w-[120px]">{role}</span>
                  <span className="text-gray-500 text-xs">{access}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right sign-in panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent-amber flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">TransitOps</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-gray-400 text-sm">Sign in to your operations dashboard</p>
          </div>

          {/* Demo credentials hint */}
          <div className="mb-6 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-blue-300 text-xs font-medium flex items-center gap-2">
              <Shield size={12} />
              Demo: use any email below with password <strong>demo1234</strong>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {['fleet@demo.com','dispatch@demo.com','safety@demo.com','finance@demo.com'].map(e => (
                <button key={e} onClick={() => setEmail(e)} className="text-[10px] text-blue-400 hover:text-blue-200 text-left truncate">
                  {e}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="label">Login as</label>
              <select
                id="role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="select"
              >
                {roles.map(r => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </div>

            {/* Remember me & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-400 bg-dark-600 accent-accent-amber"
                />
                <span className="text-gray-400 text-xs">Remember me</span>
              </label>
              <button type="button" className="text-xs text-accent-amber hover:text-accent-amber-light transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-2.5 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
