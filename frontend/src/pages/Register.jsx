import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Register = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const { registerWorkspace, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !companyEmail || !adminName || !adminEmail || !password || !confirmPassword) {
      toast.error('Please fill in all input fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLocalLoading(true);
    const result = await registerWorkspace(
      companyName,
      companyEmail,
      adminName,
      adminEmail,
      password
    );
    setLocalLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-y-auto font-sans animate-fade-in">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-primary-600/10 rounded-full blur-3xl glow-primary"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-indigo-500/10 rounded-full blur-3xl glow-pink"></div>

      <div className="w-full max-w-lg my-10 relative z-10 animate-slide-up">
        {/* App Logo & Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center font-black text-lg text-white shadow-xl shadow-primary-500/25 mb-4 hover:rotate-6 transition-transform duration-300">
            P
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-wide text-white mb-1 uppercase text-gradient-premium">
            Create Workspace
          </h2>
          <p className="text-slate-400 text-xs font-light tracking-wide text-center max-w-sm">
            Register your company workspace and create your administrator account to start managing projects.
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-900 pb-2.5 flex items-center gap-2">
              <FiBriefcase className="text-primary-400" />
              Company Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Name Field */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-200 text-xs font-bold uppercase tracking-wider">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiBriefcase className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="modern-input modern-input-with-icon"
                  />
                </div>
              </div>

              {/* Company Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-200 text-xs font-bold uppercase tracking-wider">
                  Company Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiMail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="info@acme.com"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="modern-input modern-input-with-icon"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-white font-bold text-xs uppercase tracking-wider border-b border-slate-900 pb-2.5 mt-2 flex items-center gap-2">
              <FiUser className="text-primary-400" />
              Admin Account Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Admin Name Field */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-200 text-xs font-bold uppercase tracking-wider">
                  Admin Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiUser className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="modern-input modern-input-with-icon"
                  />
                </div>
              </div>

              {/* Admin Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-200 text-xs font-bold uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiMail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="admin@acme.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="modern-input modern-input-with-icon"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-200 text-xs font-bold uppercase tracking-wider">
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
                    className="modern-input modern-input-with-icon"
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-200 text-xs font-bold uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiLock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="modern-input modern-input-with-icon"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={localLoading}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-primary-600/15 hover:shadow-primary-600/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {localLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Setting up workspace...
                </>
              ) : (
                'Create Company Workspace'
              )}
            </button>
          </form>

          {/* Prompt to login */}
          <div className="mt-6 text-center">
            <p className="text-slate-300 text-sm font-light">
              Already have a workspace code?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-400 hover:text-primary-300 hover:underline transition-colors ml-1"
              >
                Sign In to Workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
