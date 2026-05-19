import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLock, FiCheckSquare, FiBriefcase, FiAlertTriangle } from 'react-icons/fi';
import authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AcceptInvite = () => {
  const [loading, setLoading] = useState(true);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { acceptInvite } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from query params
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrorMsg('Invitation link is broken or missing security token.');
        setLoading(false);
        return;
      }

      try {
        const data = await authService.verifyInviteToken(token);
        setInviteInfo(data);
      } catch (error) {
        console.error(error);
        setErrorMsg(error.response?.data?.message || 'This invitation link has expired or is invalid.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Please enter and confirm your password.');
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

    try {
      setSubmitting(true);
      const res = await acceptInvite(token, password);
      if (res.success) {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-primary-600/10 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[80px]"></div>

      {/* Main card */}
      <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-8 shadow-2xl relative z-10 animate-slide-in">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-primary-600/20 mb-3">
            P
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Accept Invitation</h2>
          <p className="text-slate-400 text-xs font-light mt-1">
            Complete your profile registration to enter your workspace portal.
          </p>
        </div>

        {/* ERROR STATE */}
        {errorMsg ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wide">Invalid Invitation</h3>
              <p className="text-slate-400 text-xs font-light leading-relaxed px-4">
                {errorMsg}
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900/60 text-xs font-semibold cursor-pointer transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : (
          /* SUCCESS VERIFIED STATE */
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Workspace Greeting badge */}
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 flex gap-3 text-slate-300 text-xs leading-relaxed mb-1">
              <FiBriefcase className="text-indigo-400 w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                You have been invited to join <strong className="text-white font-semibold">{inviteInfo?.company?.name}</strong> as a <strong className="text-primary-400 font-semibold">{inviteInfo?.role?.toUpperCase()}</strong>.
              </div>
            </div>

            {/* Teammate Name */}
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-slate-400 font-semibold uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                disabled
                value={inviteInfo?.name || ''}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 select-none cursor-not-allowed"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-slate-400 font-semibold uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                disabled
                value={inviteInfo?.email || ''}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 select-none cursor-not-allowed"
              />
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-slate-300 font-semibold uppercase tracking-wider">Configure Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Create private password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5 text-xs">
              <label className="text-slate-300 font-semibold uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Repeat private password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Join button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Saving credentials...
                </>
              ) : (
                <>
                  <FiCheckSquare className="w-4.5 h-4.5" />
                  Join & Activate Account
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
