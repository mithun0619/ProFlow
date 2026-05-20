import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiCheckSquare,
  FiActivity,
  FiClock,
  FiTrendingUp,
  FiPlus,
  FiArrowRight,
} from 'react-icons/fi';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    priorityHigh: 0,
    priorityMedium: 0,
    priorityLow: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Scoped automatically by role on backend
        const projects = await projectService.getProjects();
        if (!isMounted) return;
        setRecentProjects(projects.slice(0, 3));

        // Get company or member tasks scoped automatically by role
        const allTasks = await taskService.getCompanyTasks().catch(() => []);
        if (!isMounted) return;

        // Calculate Stats
        const totalProjects = projects.length;
        const activeProjects = projects.filter((p) => p.status === 'active').length;
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter((t) => t.status === 'done').length;
        const pendingTasks = totalTasks - completedTasks;
        const completionRate =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const priorityHigh = allTasks.filter((t) => t.priority === 'high').length;
        const priorityMedium = allTasks.filter((t) => t.priority === 'medium').length;
        const priorityLow = allTasks.filter((t) => t.priority === 'low').length;

        setStats({
          totalProjects,
          activeProjects,
          totalTasks,
          completedTasks,
          pendingTasks,
          completionRate,
          priorityHigh,
          priorityMedium,
          priorityLow,
        });

        // Set recent tasks (sorted by creation date)
        const sortedTasks = [...allTasks]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentTasks(sortedTasks);
      } catch (error) {
        console.error('Error fetching dashboard statistics', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage={false} />;
  }

  const isMember = user?.role === 'member';

  // If user has zero projects, display empty state
  if (stats.totalProjects === 0) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Dashboard</h1>
            <p className="text-slate-400 text-xs font-light mt-0.5">
              Welcome! {isMember ? 'You have not been assigned to any project workspaces yet.' : 'Start by setting up a project workspace.'}
            </p>
          </div>
        </div>
        <EmptyState
          title={isMember ? 'No Projects Assigned' : 'Your Workspace is Empty'}
          description={
            isMember
              ? 'Once a manager or administrator assigns you to a project workspace, it will appear here alongside your tasks.'
              : "Let's organize your team's workflow! Create a project workspace to begin drafting goals, members, and custom Kanban backlogs."
          }
          actionButton={
            !isMember && (
              <Link
                to="/projects"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-2 transition-all duration-300"
              >
                <FiPlus className="w-4 h-4" />
                Create Project
              </Link>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-fade-in">
      {/* Upper header segment */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider text-gradient-premium">
            Agile Dashboard
          </h1>
          <p className="text-slate-400 text-xs font-light mt-0.5">
            {isMember
              ? `Personal workspace diagnostics for teammate: ${user?.name}`
              : 'Real-time agile workflow diagnostics and company backlog status.'}
          </p>
        </div>
        {!isMember && (
          <Link
            to="/projects"
            className="self-start md:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 hover:shadow-primary-600/25 flex items-center gap-2 transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <FiPlus className="w-4 h-4 animate-pulse" />
            Manage Workspaces
          </Link>
        )}
      </div>

      {/* Grid of Key Statistics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Projects Card */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 flex items-center justify-between shadow-lg">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
              {isMember ? 'My Projects' : 'Total Workspaces'}
            </span>
            <span className="text-2xl font-black text-white">{stats.totalProjects}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
            <FiBriefcase className="w-4 h-4" />
          </div>
        </div>

        {/* Active Projects */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 flex items-center justify-between shadow-lg">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
              Active Tracks
            </span>
            <span className="text-2xl font-black text-white">{stats.activeProjects}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FiActivity className="w-4 h-4" />
          </div>
        </div>

        {/* Total Tasks */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 flex items-center justify-between shadow-lg">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
              {isMember ? 'My Tasks Assigned' : 'Backlog Tasks'}
            </span>
            <span className="text-2xl font-black text-white">{stats.totalTasks}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <FiCheckSquare className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 flex items-center justify-between shadow-lg">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
              {isMember ? 'Pending Tasks' : 'Open Backlog'}
            </span>
            <span className="text-2xl font-black text-white">{stats.pendingTasks}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FiClock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Charts & Analytical Breakdown Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Widget: Radial completion gauge */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-primary-400 w-4 h-4" />
            {isMember ? 'Tasks Completion Gauge' : 'Backlog Completion Gauge'}
          </h3>
          <div className="flex flex-col items-center justify-center py-4 gap-5">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-900"
                  strokeWidth="7"
                  fill="transparent"
                />
                {/* Active Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-primary-500"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * stats.completionRate) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{stats.completionRate}%</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                  Done
                </span>
              </div>
            </div>
            <p className="text-center text-slate-400 text-[11px] font-light max-w-[200px] leading-relaxed mt-1">
              {isMember
                ? 'Completion rate of tasks specifically assigned to your backlog.'
                : 'Overall completion rate of project goals and backlog tasks.'}
            </p>
          </div>
        </div>

        {/* Center Widget: Priority distribution */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg flex flex-col justify-between gap-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Priority Distribution
          </h3>
          <div className="flex flex-col gap-4 py-2">
            {/* High Priority Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-rose-400 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> High Priority
                </span>
                <span className="text-slate-500 font-medium text-[11px]">{stats.priorityHigh} Tasks</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.priorityHigh / stats.totalTasks) * 100 : 0}%`,
                    transition: 'width 0.8s ease-in-out',
                  }}
                ></div>
              </div>
            </div>

            {/* Medium Priority Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-amber-400 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Medium Priority
                </span>
                <span className="text-slate-500 font-medium text-[11px]">{stats.priorityMedium} Tasks</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.priorityMedium / stats.totalTasks) * 100 : 0}%`,
                    transition: 'width 0.8s ease-in-out',
                  }}
                ></div>
              </div>
            </div>

            {/* Low Priority Bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Low Priority
                </span>
                <span className="text-slate-500 font-medium text-[11px]">{stats.priorityLow} Tasks</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  style={{
                    width: `${stats.totalTasks > 0 ? (stats.priorityLow / stats.totalTasks) * 100 : 0}%`,
                    transition: 'width 0.8s ease-in-out',
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-3 text-[9px] text-slate-500 text-center font-bold uppercase tracking-wider">
            {isMember ? 'My Queue' : 'Workspace Backlog'}: {stats.totalTasks} Tasks
          </div>
        </div>

        {/* Right Widget: Recents Activity Ledger */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg flex flex-col">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
            {isMember ? 'My Activity Feed' : 'Backlog Timeline'}
          </h3>
          <div className="flex-grow flex flex-col gap-4 overflow-y-auto max-h-[220px] pr-1">
            {recentTasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 text-[10px] uppercase tracking-widest font-bold py-10">
                No recent activities
              </div>
            ) : (
              recentTasks.map((t) => (
                <div key={t._id} className="flex gap-3 text-xs leading-normal animate-slide-up">
                  <div className="flex-shrink-0 mt-0.5">
                    {t.status === 'done' ? (
                      <span className="w-4 h-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-md bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center text-[9px] font-bold">
                        •
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-slate-300 truncate font-semibold">
                      Task{' '}
                      <span
                        onClick={() => navigate(`/projects/${t.projectId?._id || t.projectId}`)}
                        className="text-white hover:text-primary-400 hover:underline cursor-pointer transition-colors"
                      >
                        "{t.title}"
                      </span>{' '}
                      modified
                    </p>
                    <span className="text-[9px] text-slate-500 font-light block mt-0.5 uppercase tracking-wide">
                      {t.status.toUpperCase()} • {t.priority.toUpperCase()} Priority
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Workspaces Grid */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-black text-white uppercase tracking-wider">
          {isMember ? 'My Active Workspaces' : 'Active Workspaces'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recentProjects.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/projects/${p._id}`)}
              className="glass-panel glass-panel-hover rounded-2xl p-5 border border-white/5 shadow-md flex flex-col justify-between gap-5 cursor-pointer relative overflow-hidden group"
            >
              {/* Highlight bar hover effect */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <h4 className="text-white font-bold text-sm truncate leading-snug group-hover:text-primary-400 transition-colors">
                    {p.name}
                  </h4>
                  <span
                    className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      p.status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : p.status === 'active'
                          ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                          : p.status === 'on-hold'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-light line-clamp-2 leading-relaxed">
                  {p.description || 'No description provided.'}
                </p>
              </div>

              {/* Card Footer detail */}
              <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-[9px] text-slate-500">
                <span>
                  Collaborators: <strong className="text-slate-300 font-semibold">{p.members?.length || 1}</strong>
                </span>
                <span className="flex items-center gap-1 group-hover:text-primary-400 transition-colors uppercase tracking-wider font-bold">
                  Open Board <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
