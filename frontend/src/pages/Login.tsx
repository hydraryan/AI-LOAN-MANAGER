import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, getSession, signin } from '../lib/api/auth';
import { Lock, Mail, Loader2, AlertCircle, LogIn, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        await getSession();
        navigate('/', { replace: true });
      } catch {
        // no active session - show login form
      }
    };

    checkExistingSession();

    const search = new URLSearchParams(location.search);
    if (search.get('session') === 'expired') {
      setError('Session expired for security reasons. Sign in again to continue.');
    }
  }, [location.search, navigate]);

  const validateForm = () => {
    const nextErrors = { email: '', password: '' };
    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();

    if (!email) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const search = new URLSearchParams(location.search);
      const nextFromQuery = search.get('next');
      const fromState = (location.state as any)?.from?.pathname;
      const from = nextFromQuery || fromState || '/';

      await signin({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-grainy-gradient px-4 py-10 sm:px-6 lg:px-8">
      <div className="login-orb login-orb-left" />
      <div className="login-orb login-orb-right" />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col items-center justify-center gap-5">
        <div className="animate-fadein text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/60 bg-blue-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            <ShieldCheck className="h-4 w-4" /> Secured Access
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-5xl">Command Center Login</h1>
        </div>

        <section className="animate-fadein-delayed login-panel w-full max-w-xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Login</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Use authorized credentials only</p>
            </div>
          </div>

          {error && (
            <div className="animate-fadein rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  className={`login-input w-full rounded-xl border py-3 pl-11 pr-3 text-sm outline-none ${fieldErrors.email ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-blue-500'} dark:border-slate-700 dark:bg-slate-950 dark:text-white`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`login-input w-full rounded-xl border py-3 pl-11 pr-3 text-sm outline-none ${fieldErrors.password ? 'border-red-300 focus:border-red-400' : 'border-slate-300 focus:border-blue-500'} dark:border-slate-700 dark:bg-slate-950 dark:text-white`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                />
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Signing in...
                </>
              ) : (
                'Sign in securely'
              )}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            By continuing, you confirm this is an authorized admin environment.
          </p>
        </section>

        <section className="animate-fadein login-support w-full max-w-xl rounded-2xl border border-white/60 bg-white/50 p-3 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/35">
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            <div className="rounded-xl bg-white/65 px-2 py-2 font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">Session Rotation</div>
            <div className="rounded-xl bg-white/65 px-2 py-2 font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">Attempt Limits</div>
            <div className="rounded-xl bg-white/65 px-2 py-2 font-medium text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">Audit Events</div>
          </div>
        </section>
        </div>
    </div>
  );
};

export default Login;
