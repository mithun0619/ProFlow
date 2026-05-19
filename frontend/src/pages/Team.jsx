import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiTrash2, FiMail, FiUser, FiSliders, FiX, FiCopy, FiCheck } from 'react-icons/fi';
import { FaWhatsapp, FaTelegramPlane, FaEnvelope } from 'react-icons/fa';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Invite Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Shareable Link Modal State
  const [createdInvite, setCreatedInvite] = useState(null); // stores { name, email, role, inviteLink }
  const [isCopied, setIsCopied] = useState(false);

  const { user: currentUser } = useAuth();

  const handleCopyLink = () => {
    if (!createdInvite?.inviteLink) return;
    navigator.clipboard.writeText(createdInvite.inviteLink);
    setIsCopied(true);
    toast.success('Invitation link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getCompanyUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load company teammates directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail || !inviteRole) {
      toast.error('Please enter name, email, and role.');
      return;
    }

    try {
      setInviteLoading(true);
      const data = await authService.inviteUser({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });

      toast.success(`Successfully invited ${inviteName}!`);
      setIsInviteOpen(false);

      // Save created invite details to show in success popup
      setCreatedInvite({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        inviteLink: data.inviteLink || `${window.location.origin}/accept-invite?token=${data.inviteToken}`,
      });

      // Reset
      setInviteName('');
      setInviteEmail('');
      setInviteRole('member');

      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to invite user to workspace.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveUser = async (userId, name) => {
    if (window.confirm(`Are you absolutely sure you want to remove ${name} from your company workspace? They will lose access instantly.`)) {
      try {
        await authService.deleteUser(userId);
        toast.success(`${name} has been removed from workspace.`);
        fetchUsers();
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to remove user.');
      }
    }
  };

  const getAvatarLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

  if (loading) {
    return <LoadingSpinner />;
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-sans">
      {/* Header and Invite Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Team Directory</h1>
          <p className="text-slate-400 text-xs font-light mt-0.5">
            List and manage workspace collaborator profiles, roles, and login access.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-2 transition-all duration-300 cursor-pointer"
          >
            <FiUserPlus className="w-4 h-4" />
            Invite Teammate
          </button>
        )}
      </div>

      {/* Teammates List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const isSelf = u._id === currentUser?._id;
          return (
            <div
              key={u._id}
              className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg flex flex-col justify-between gap-6 relative overflow-hidden group"
            >
              {/* Profile details */}
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-base shadow-inner flex-shrink-0"
                  style={{ backgroundColor: u.avatarColor || '#6366f1' }}
                >
                  {getAvatarLetter(u.name)}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-white font-extrabold text-sm truncate flex items-center gap-1.5">
                    {u.name}
                    {isSelf && (
                      <span className="text-[8px] bg-primary-500/10 border border-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full uppercase font-bold">
                        You
                      </span>
                    )}
                  </h3>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase font-bold inline-block mt-1">
                    {u.role}
                  </span>
                  <p className="text-slate-400 text-xs font-light truncate mt-2 flex items-center gap-1.5">
                    <FiMail className="w-3.5 h-3.5 text-slate-500" />
                    {u.email}
                  </p>
                </div>
              </div>

              {/* Teammate Actions footer */}
              {isAdmin && !isSelf && (
                <div className="border-t border-slate-800/80 pt-4 flex justify-end">
                  <button
                    onClick={() => handleRemoveUser(u._id, u.name)}
                    className="px-3 py-1.5 rounded-lg border border-rose-500/10 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Remove Teammate
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* INVITE NEW TEAMMATE MODAL */}
      {isInviteOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div onClick={() => setIsInviteOpen(false)} className="absolute inset-0"></div>
          <div className="w-full max-w-md glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl relative z-10 animate-slide-in">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-3">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wide flex items-center gap-2">
                <FiUserPlus className="text-primary-400 w-5 h-5" />
                Invite Workspace Teammate
              </h3>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="flex flex-col gap-4">
              {/* Name Field */}
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
                    placeholder="Jane Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
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
                    placeholder="jane@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  Workspace Role
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FiSliders className="w-4 h-4" />
                  </span>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-primary-500 cursor-pointer"
                  >
                    <option value="member">Teammate Member (View-only + assigned status updates)</option>
                    <option value="manager">Teammate Manager (Full board CRUD + task assignments)</option>
                  </select>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 mt-4 border-t border-slate-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {inviteLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Inviting...
                    </>
                  ) : (
                    'Add Teammate'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE SUCCESS MODAL WITH COPYABLE LINK */}
      {createdInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div onClick={() => setCreatedInvite(null)} className="absolute inset-0"></div>
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-7 shadow-2xl relative z-10 animate-slide-in overflow-hidden">
            {/* Ambient Background Glow inside the card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-start justify-between mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FiCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-extrabold text-base uppercase tracking-wider">
                    Teammate Invited!
                  </h3>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">
                    Account created. The teammate is now pending registration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedInvite(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 relative z-10">
              {/* Teammate Summary Card */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center font-black text-sm uppercase">
                  {createdInvite.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold">{createdInvite.name}</h4>
                  <p className="text-[10px] text-slate-400 font-light">{createdInvite.email}</p>
                  <span className="text-[8px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full uppercase font-bold inline-block mt-1">
                    {createdInvite.role}
                  </span>
                </div>
              </div>



              {/* Shareable Link Input Group */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Secure Invitation Link
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={createdInvite.inviteLink}
                      onClick={(e) => e.target.select()}
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 font-mono focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-3 rounded-xl flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                        : 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/15'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <FiCheck className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-3.5 h-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Multi-Platform Sharing Row */}
              <div className="flex flex-col gap-2 mt-2 border-t border-slate-800/60 pt-4">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  Quick Share to Teammate
                </label>
                <div className="flex items-center gap-3">
                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Hello ${createdInvite.name},\n\nYou have been invited to join our secure company workspace on ProFlow as a ${createdInvite.role?.toUpperCase()}.\n\nClick the link below to accept the invitation and configure your password:\n${createdInvite.inviteLink}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white text-[#25D366] flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#25D366]/20"
                    title="Share via WhatsApp"
                  >
                    <FaWhatsapp className="w-5 h-5" />
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      createdInvite.inviteLink
                    )}&text=${encodeURIComponent(
                      `Hello ${createdInvite.name}, join our secure company workspace on ProFlow as a ${createdInvite.role?.toUpperCase()}!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20 hover:bg-[#0088cc] hover:text-white text-[#0088cc] flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#0088cc]/20"
                    title="Share via Telegram"
                  >
                    <FaTelegramPlane className="w-4.5 h-4.5" />
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:${createdInvite.email}?subject=${encodeURIComponent(
                      `Workspace Invitation: Join our ProFlow Workspace`
                    )}&body=${encodeURIComponent(
                      `Hello ${createdInvite.name},\n\nYou have been invited to join our secure company workspace on ProFlow as a ${createdInvite.role?.toUpperCase()}.\n\nClick the link below to accept the invitation and configure your password:\n\n${createdInvite.inviteLink}\n\nThis invitation link will expire in 7 days.\n\nBest regards,\nYour Workspace Admin`
                    )}`}
                    className="w-10 h-10 rounded-xl bg-[#ea4335]/10 border border-[#ea4335]/20 hover:bg-[#ea4335] hover:text-white text-[#ea4335] flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#ea4335]/20"
                    title="Share via Email"
                  >
                    <FaEnvelope className="w-4.5 h-4.5" />
                  </a>
                </div>
              </div>

              {/* Action footer */}
              <div className="flex justify-end mt-4 border-t border-slate-800/80 pt-4">
                <button
                  onClick={() => setCreatedInvite(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
