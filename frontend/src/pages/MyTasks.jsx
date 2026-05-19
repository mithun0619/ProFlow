import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckSquare,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiFolder,
} from 'react-icons/fi';
import taskService from '../services/taskService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getCompanyTasks(); // scoped to current user tasks on backend if role is member
      setTasks(data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load your personal tasks backlog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusShift = async (taskId, currentStatus, direction) => {
    const lanes = ['todo', 'in-progress', 'review', 'done'];
    const currentIndex = lanes.indexOf(currentStatus);
    let nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < lanes.length) {
      const nextStatus = lanes[nextIndex];
      try {
        // Optimistic UI Shift
        setTasks(tasks.map((t) => (t._id === taskId ? { ...t, status: nextStatus } : t)));
        await taskService.updateTask(taskId, { status: nextStatus });
        toast.success(`Task shifted to ${nextStatus.toUpperCase()}`);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to update task status.');
        fetchTasks();
      }
    }
  };

  const getTasksByLane = (lane) => tasks.filter((t) => t.status === lane);

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-sans">
      {/* Header and Details */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <FiCheckSquare className="text-primary-400 w-6 h-6" />
          My Personal Backlog
        </h1>
        <p className="text-slate-400 text-xs font-light mt-0.5">
          View all tasks assigned directly to your avatar and manage their board lanes.
        </p>
      </div>

      {/* Lanes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start mt-2">
        {[
          { key: 'todo', title: 'To Do', border: 'border-slate-800' },
          { key: 'in-progress', title: 'In Progress', border: 'border-primary-500/20' },
          { key: 'review', title: 'In Review', border: 'border-indigo-500/20' },
          { key: 'done', title: 'Completed', border: 'border-emerald-500/20' },
        ].map((lane) => {
          const laneTasks = getTasksByLane(lane.key);
          return (
            <div
              key={lane.key}
              className={`flex flex-col gap-4 rounded-2xl bg-dark-900/60 border ${lane.border} p-4 shadow-sm`}
            >
              {/* Lane Header */}
              <div className="flex items-center justify-between border-b border-slate-800/50 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-extrabold text-xs uppercase tracking-wider">
                    {lane.title}
                  </h3>
                  <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded-full">
                    {laneTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="flex flex-col gap-3 min-h-[250px] overflow-y-auto max-h-[500px] pr-1">
                {laneTasks.length === 0 ? (
                  <div className="my-auto flex items-center justify-center">
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold text-center">
                      Lane Empty
                    </p>
                  </div>
                ) : (
                  laneTasks.map((t) => (
                    <div
                      key={t._id}
                      className="glass-panel rounded-xl p-4 border border-white/5 shadow-md flex flex-col gap-4 group relative overflow-hidden"
                    >
                      {/* Priority */}
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase ${getPriorityColor(
                            t.priority
                          )}`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="flex flex-col gap-1.5">
                        <h4
                          onClick={() => navigate(`/projects/${t.projectId?._id || t.projectId}`)}
                          className="text-white font-bold text-xs leading-snug hover:text-primary-400 transition-colors cursor-pointer"
                        >
                          {t.title}
                        </h4>
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                          <FiFolder className="w-3 h-3" />
                          {t.projectId?.name || 'Board'}
                        </span>
                        {t.description && (
                          <p className="text-slate-400 text-[11px] font-light leading-relaxed line-clamp-2 mt-1">
                            {t.description}
                          </p>
                        )}
                      </div>

                      {/* Footer: Date and Shifter arrows */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/50 pt-3 text-[10px] text-slate-500">
                        {/* Due Date */}
                        <div className="flex items-center gap-1.5 text-slate-500 font-light text-[10px]">
                          <FiCalendar className="w-3.5 h-3.5 text-slate-600" />
                          <span>
                            {t.dueDate
                              ? new Date(t.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'No Timeline'}
                          </span>
                        </div>

                        {/* Arrows */}
                        <div className="flex items-center gap-1">
                          <button
                            disabled={lane.key === 'todo'}
                            onClick={() => handleStatusShift(t._id, lane.key, -1)}
                            className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 disabled:opacity-30 cursor-pointer"
                          >
                            <FiChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={lane.key === 'done'}
                            onClick={() => handleStatusShift(t._id, lane.key, 1)}
                            className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 disabled:opacity-30 cursor-pointer"
                          >
                            <FiChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyTasks;
