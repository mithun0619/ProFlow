import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckSquare, FiSearch, FiCalendar } from 'react-icons/fi';
import taskService from '../services/taskService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getCompanyTasks();
      setTasks(data);
      setFilteredTasks(data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load company backlog tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...tasks];

    // Search filter
    if (search.trim()) {
      result = result.filter((t) =>
        t.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    setFilteredTasks(result);
  }, [search, statusFilter, priorityFilter, tasks]);

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

  const getStatusBadge = (s) => {
    switch (s) {
      case 'done':
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
      case 'review':
        return 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400';
      case 'in-progress':
        return 'bg-primary-500/10 border border-primary-500/20 text-primary-400';
      default:
        return 'bg-slate-500/10 border border-slate-500/20 text-slate-400';
    }
  };

  const getAvatarLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

  if (loading) {
    return <LoadingSpinner />;
  }

  const isMember = user?.role === 'member';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-sans">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider">
          {isMember ? 'My Tasks Backlog' : 'Workspace Tasks Backlog'}
        </h1>
        <p className="text-slate-400 text-xs font-light mt-0.5">
          {isMember
            ? 'Complete list of task backlogs assigned directly to you across all projects.'
            : 'Track, search, and manage tasks across all active workspaces in your company.'}
        </p>
      </div>

      {/* Search & Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-dark-900 border border-slate-800/80 p-4 rounded-2xl shadow-inner">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <FiSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-primary-500 cursor-pointer"
        >
          <option value="all">All Backlog Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="done">Completed</option>
        </select>

        {/* Priority Dropdown */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-primary-500 cursor-pointer"
        >
          <option value="all">All Task Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>

      {/* Task Cards Stack List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No tasks match filters"
          description="Try adjusting your search query, status, or priority filters to find tasks in your logs."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTasks.map((t) => (
            <div
              key={t._id}
              onClick={() => navigate(`/projects/${t.projectId?._id || t.projectId}`)}
              className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer relative overflow-hidden group"
            >
              {/* Left Indicator side highlight */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              {/* Task Details */}
              <div className="flex items-start gap-3.5 max-w-xl">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-center text-primary-400 flex-shrink-0 mt-0.5">
                  <FiCheckSquare className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-white font-extrabold text-sm leading-snug group-hover:text-primary-400 transition-colors truncate">
                    {t.title}
                  </h3>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-1 block">
                    Workspace: <strong className="text-slate-400 font-semibold">{t.projectId?.name || 'Agile Board'}</strong>
                  </span>
                  {t.description && (
                    <p className="text-slate-400 text-xs font-light mt-2 line-clamp-1 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Badges / Meta segment */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium md:self-center">
                {/* Priority Badge */}
                <span
                  className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${getPriorityColor(
                    t.priority
                  )}`}
                >
                  {t.priority}
                </span>

                {/* Status Badge */}
                <span
                  className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${getStatusBadge(
                    t.status
                  )}`}
                >
                  {t.status}
                </span>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-slate-500 font-light text-[11px]">
                  <FiCalendar className="w-4 h-4 text-slate-600" />
                  <span>
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No Timeline'}
                  </span>
                </div>

                {/* Assignee */}
                <div className="flex items-center gap-1.5 overflow-hidden border-l border-slate-800 pl-4 h-6">
                  {t.assignedTo ? (
                    <>
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-white text-[9px] flex-shrink-0"
                        style={{ backgroundColor: t.assignedTo.avatarColor || '#6366f1' }}
                      >
                        {getAvatarLetter(t.assignedTo.name)}
                      </div>
                      <span className="truncate text-slate-400 text-[11px] font-light max-w-[80px]">
                        {t.assignedTo.name}
                      </span>
                    </>
                  ) : (
                    <span className="italic text-slate-600 text-[11px] font-light">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
