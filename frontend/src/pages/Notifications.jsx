import React, { useState, useEffect } from 'react';
import { FiBell, FiTrash2, FiCheckSquare, FiCalendar } from 'react-icons/fi';
import notificationService from '../services/notificationService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load activity notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      toast.success('All activity marked as read');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto font-sans">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FiBell className="text-primary-400 w-6 h-6" />
            Activity Ledger
          </h1>
          <p className="text-slate-400 text-xs font-light mt-0.5">
            Chronological audit log of all sprint movements and member assignments in your company.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="self-start sm:self-center px-4 py-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiCheckSquare className="w-4 h-4 text-emerald-400" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          title="No activity alerts logged"
          description="Your active logs will appear here chronological as workspaces are created, and teammates modify tasks."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex items-start gap-4 ${
                n.isRead
                  ? 'bg-slate-900/20 border-slate-850 text-slate-400'
                  : 'bg-primary-500/5 border-primary-500/10 text-slate-200 shadow-md'
              }`}
            >
              {/* Alert Bell indicator */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.isRead
                    ? 'bg-slate-950/60 text-slate-500'
                    : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                }`}
              >
                <FiBell className="w-4.5 h-4.5" />
              </div>

              {/* Message Details */}
              <div className="flex-grow overflow-hidden">
                <p className="text-xs leading-relaxed pr-6">{n.message}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-light mt-2.5">
                  <FiCalendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Quick Mark Read button */}
              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-primary-400 cursor-pointer"
                  title="Mark as Read"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
