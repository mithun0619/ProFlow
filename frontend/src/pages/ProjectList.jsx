import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiCalendar,
  FiUsers,
  FiFolder,
  FiX,
  FiArrowRight,
} from 'react-icons/fi';
import projectService from '../services/projectService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [dueDate, setDueDate] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error('Error fetching projects list', error);
      toast.error(error.response?.data?.message || 'Failed to load project workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Filter projects when search query or status filter changes
  useEffect(() => {
    let result = [...projects];

    // Apply Search Filter
    if (search.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(result);
  }, [search, statusFilter, projects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name) {
      toast.error('Project name is required');
      return;
    }

    try {
      setModalLoading(true);
      const newProject = await projectService.createProject({
        name,
        description,
        status,
        dueDate: dueDate || undefined,
      });

      toast.success('Project workspace created successfully!');
      setIsModalOpen(false);

      // Reset form fields
      setName('');
      setDescription('');
      setStatus('planning');
      setDueDate('');

      // Refresh list
      fetchProjects();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create project workspace.');
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'active':
        return 'bg-primary-500/10 border-primary-500/20 text-primary-400';
      case 'on-hold':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default:
        return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-sans animate-fade-in">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider text-gradient-premium">Workspaces</h1>
          <p className="text-slate-400 text-xs font-light mt-0.5">
            Manage agile team workspaces and collaborate on backlogs.
          </p>
        </div>
        {isManagerOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-2 transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <FiPlus className="w-4 h-4 animate-pulse" />
            New Workspace
          </button>
        )}
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/20 border border-slate-900 p-4 rounded-2xl shadow-inner backdrop-blur-md">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <FiSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search workspaces by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="modern-input pl-10"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="modern-input w-full md:w-auto cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title={search || statusFilter !== 'all' ? 'No workspaces match filters' : 'No workspaces yet'}
          description={
            search || statusFilter !== 'all'
              ? 'Try adjusting your search queries or status filters.'
              : isManagerOrAdmin
                ? 'Create your first project workspace to begin tracking your team backlogs.'
                : 'You are not currently associated with any project workspaces.'
          }
          actionButton={
            !(search || statusFilter !== 'all') && isManagerOrAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-2 transition-all duration-300"
              >
                <FiPlus className="w-4 h-4" />
                New Workspace
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/projects/${p._id}`)}
              className="glass-panel glass-panel-hover rounded-2xl p-6 border border-white/5 shadow-lg flex flex-col justify-between gap-6 cursor-pointer relative overflow-hidden group"
            >
              {/* Glowing highlight indicator */}
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-white font-extrabold text-base leading-tight truncate group-hover:text-primary-400 transition-colors">
                    {p.name}
                  </h3>
                  <span
                    className={`text-[8px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${getStatusColor(
                      p.status
                    )}`}
                  >
                    {p.status}
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-light leading-relaxed line-clamp-3">
                  {p.description || 'No description provided for this workspace.'}
                </p>
              </div>

              {/* Grid Card Footer details */}
              <div className="flex flex-col gap-4 border-t border-slate-900 pt-4">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-light">
                  {/* Due date */}
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="w-4 h-4 text-slate-500" />
                    <span>
                      {p.dueDate
                        ? new Date(p.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'No Timeline'}
                    </span>
                  </div>

                  {/* Members count */}
                  <div className="flex items-center gap-1.5">
                    <FiUsers className="w-4 h-4 text-slate-500" />
                    <span>{p.members?.length || 1} Collaborators</span>
                  </div>
                </div>

                <div className="flex items-center justify-end text-[10px] uppercase font-bold text-slate-500 group-hover:text-primary-400 transition-colors pt-1">
                  <span className="flex items-center gap-1.5">
                    Open Board <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE WORKSPACE MODAL */}
      {isModalOpen && isManagerOrAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          {/* Backdrop trigger close */}
          <div onClick={() => setIsModalOpen(false)} className="absolute inset-0"></div>

          {/* Form container */}
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl relative z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-slate-900 pb-3">
              <h3 className="text-white font-extrabold text-sm flex items-center gap-2 uppercase tracking-wider">
                <FiFolder className="text-primary-400 w-4 h-4" />
                Create Workspace
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              {/* Workspace Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Application V2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="modern-input"
                />
              </div>

              {/* Workspace Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  placeholder="Describe the workspace parameters and milestones..."
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="modern-input resize-none"
                />
              </div>

              {/* Status and Due Date side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="modern-input cursor-pointer"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="modern-input cursor-pointer"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 transition-all duration-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {modalLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Workspace'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
