import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiLock, FiBriefcase, FiSliders, FiSave } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error('Name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const data = { name };
      if (newPassword) {
        if (!password) {
          toast.error('Current password is required to set a new password.');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          toast.error('New passwords do not match.');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error('New password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        data.currentPassword = password;
        data.password = newPassword;
      }

      const result = await updateProfile(data);
      if (result.success) {
        toast.success('Profile settings updated successfully!');
        // Reset password fields
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto font-sans">
      {/* Header segment */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <FiSliders className="text-primary-400 w-6 h-6" />
          Teammate Profile
        </h1>
        <p className="text-slate-400 text-xs font-light mt-0.5">
          Manage your account profile parameters, passwords, and view system permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Card: Quick Identity Details */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg flex flex-col items-center justify-center gap-4 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-xl shadow-indigo-500/10"
            style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
          >
            {getAvatarLetter(user?.name)}
          </div>
          <div>
            <h3 className="text-white font-extrabold text-base leading-snug">{user?.name}</h3>
            <span className="text-[9px] bg-slate-800 text-primary-400 px-2 py-0.5 rounded-full uppercase font-bold mt-1.5 inline-block">
              {user?.role} Permissions
            </span>
          </div>

          <div className="w-full border-t border-slate-800/80 pt-4 flex flex-col gap-3.5 text-left text-xs font-light text-slate-400">
            <div className="flex items-center justify-between">
              <span>Account Email:</span>
              <strong className="text-white font-semibold truncate max-w-[150px]">{user?.email}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Workspace:</span>
              <strong className="text-white font-semibold truncate max-w-[150px]">{user?.company?.name}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Workspace Code:</span>
              <strong className="text-primary-400 font-mono font-bold">{user?.company?.companyCode}</strong>
            </div>
          </div>
        </div>

        {/* Right Forms Card */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-slate-800/80 pb-2.5 flex items-center gap-2">
              <FiUser className="text-primary-400" />
              General Details
            </h3>

            {/* Teammate Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <FiUser className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <h3 className="text-white font-bold text-sm uppercase tracking-wider border-b border-slate-800/80 pb-2.5 mt-2 flex items-center gap-2">
              <FiLock className="text-primary-400" />
              Update Password
            </h3>

            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Current Password (required for modifications)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <FiLock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiLock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiLock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end mt-4 border-t border-slate-800/80 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Saving changes...
                  </>
                ) : (
                  <>
                    <FiSave className="w-4 h-4" />
                    Save Account Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
