import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  FiGrid,
  FiBriefcase,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiBell,
  FiChevronDown,
  FiUsers,
  FiCheckSquare,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';
import notificationService from '../services/notificationService';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      if (user) {
        const data = await notificationService.getNotifications();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error(error);
    }
  };

  // Clipboard copy for Company Code
  const handleCopyCode = () => {
    if (user?.company?.companyCode) {
      navigator.clipboard.writeText(user.company.companyCode);
      setCopied(true);
      toast.success('Company workspace code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // NavItems depending on User Role
  const getNavItems = () => {
    const common = [
      { name: 'Dashboard', path: '/', icon: <FiGrid className="w-5 h-5" /> },
      { name: 'Workspaces', path: '/projects', icon: <FiBriefcase className="w-5 h-5" /> },
    ];

    if (user?.role === 'admin' || user?.role === 'manager') {
      return [
        ...common,
        { name: 'All Tasks', path: '/tasks', icon: <FiCheckSquare className="w-5 h-5" /> },
        { name: 'Team Directory', path: '/team', icon: <FiUsers className="w-5 h-5" /> },
        { name: 'My Profile', path: '/profile', icon: <FiUser className="w-5 h-5" /> },
      ];
    } else {
      // Member
      return [
        ...common,
        { name: 'My Backlog', path: '/my-tasks', icon: <FiCheckSquare className="w-5 h-5" /> },
        { name: 'My Profile', path: '/profile', icon: <FiUser className="w-5 h-5" /> },
      ];
    }
  };

  const navItems = getNavItems();

  const getAvatarLetter = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200 font-sans">
      {/* Toast Notification Container */}
      <Toast />

      {/* BACKDROP FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        ></div>
      )}

      {/* SIDEBAR PANEL */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 p-5 flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Sidebar Header Title */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 mt-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-primary-500/20">
                P
              </div>
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-slate-100 to-primary-200 bg-clip-text text-transparent">
                PROFLOW
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Company Workspace Code Copier */}
          {user?.company && (
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Workspace: {user.company.name}
              </span>
              <div className="flex items-center justify-between gap-1.5 mt-0.5">
                <span className="text-xs font-mono font-bold text-primary-400 select-all truncate">
                  {user.company.companyCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy Workspace Code"
                >
                  {copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-400" /> : <FiCopy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/15'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card inside Sidebar Footer */}
        <div className="border-t border-slate-800/80 pt-4 mt-auto">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-950/40 border border-slate-900/60 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-inner text-xs"
              style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
            >
              {getAvatarLetter(user?.name)}
            </div>
            <div className="overflow-hidden">
              <h5 className="text-xs font-semibold text-white truncate leading-tight flex items-center gap-1.5">
                {user?.name}
                <span className="text-[8px] bg-slate-800 text-primary-400 px-1.5 py-0.5 rounded-full uppercase font-bold">
                  {user?.role}
                </span>
              </h5>
              <p className="text-[10px] text-slate-500 truncate font-light mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl font-medium text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 cursor-pointer"
          >
            <FiLogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORTS */}
      <div className="flex-grow flex flex-col min-w-0 lg:h-screen lg:overflow-y-auto relative">
        {/* TOP NAVBAR */}
        <header className="h-16 px-4 md:px-8 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
          {/* Left: Mobile sidebar menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850"
            >
              <FiMenu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                Workspace / <strong className="text-slate-400 font-semibold">{user?.company?.name || 'Private'}</strong>
              </span>
            </div>
          </div>

          {/* Right: Quick actions and avatar menu */}
          <div className="flex items-center gap-3 relative">
            {/* Notifications Indicator Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition-colors relative cursor-pointer"
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 animate-ping"></span>
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary-500 flex items-center justify-center text-[7px] text-white font-bold"></span>
                  </>
                )}
              </button>

              {/* Notification Popover slideover */}
              {showNotifications && (
                <>
                  <div
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 z-40"
                  ></div>
                  <div className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-2xl p-4 glass-panel animate-slide-in z-50">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FiBell className="text-primary-400" /> Notifications Feed
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-[9px] font-bold text-primary-400 hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="text-center py-6 text-slate-500 text-xs font-light">
                          No notifications to log.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition-all flex flex-col gap-1.5 relative group ${
                              n.isRead
                                ? 'bg-slate-950/20 border-slate-850 text-slate-400'
                                : 'bg-primary-500/5 border-primary-500/10 text-slate-200'
                            }`}
                          >
                            <p>{n.message}</p>
                            <div className="flex items-center justify-between text-[8px] text-slate-500">
                              <span>
                                {new Date(n.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {!n.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(n._id)}
                                  className="text-[9px] text-primary-400 font-bold hover:underline cursor-pointer"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="block text-center border-t border-slate-800 pt-2.5 mt-3 text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                    >
                      View All Activity
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Dropdown Menu Profile */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[11px]"
                  style={{ backgroundColor: user?.avatarColor || '#6366f1' }}
                >
                  {getAvatarLetter(user?.name)}
                </div>
                <span className="hidden md:inline text-xs font-semibold text-slate-200">
                  {user?.name}
                </span>
                <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown Popup */}
              {userDropdownOpen && (
                <>
                  <div
                    onClick={() => setUserDropdownOpen(false)}
                    className="fixed inset-0 z-30"
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800/80 p-1.5 shadow-2xl glass-panel animate-slide-in z-45">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                    >
                      <FiUser className="w-4 h-4 text-slate-400" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* DYNAMIC SCENE PAGE CONTENT CONTAINER */}
        <main className="flex-grow p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
