import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Login = () => {
  const [companyCode, setCompanyCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyCode || !email || !password) {
      toast.error('Please enter company code, email, and password.');
      return;
    }

    setLocalLoading(true);
    const result = await login(companyCode, email, password);
    setLocalLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary-600/10 rounded-full blur-3xl glow-indigo"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl glow-pink"></div>

      <div className="w-full max-w-md animate-slide-in relative z-10">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center font-bold text-xl text-white shadow-xl shadow-primary-500/20 mb-4 animate-pulse">
            P
          </div>
          <h2 className="text-2xl font-black tracking-wide text-white mb-1 uppercase">
            Sign In to Workspace
          </h2>
          <p className="text-slate-400 text-xs font-light tracking-wide">
            Manage your project workspaces and team goals
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Company Code Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Company Code
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <FiBriefcase className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="COM-123456"
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <FiMail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={localLoading}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 hover:shadow-primary-600/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {localLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Prompt to register */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-xs font-light">
              Need to register a company workspace?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-400 hover:text-primary-300 hover:underline transition-colors ml-1"
              >
                Register Workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
