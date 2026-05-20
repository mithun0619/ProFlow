import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiCalendar,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiFolder,
  FiCheck,
  FiX,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyUsers, setCompanyUsers] = useState([]);

  // Modals and Forms State
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('planning');
  const [editDueDate, setEditDueDate] = useState('');

  // Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null); // Used if we are editing an existing task
  const [taskLoading, setTaskLoading] = useState(false);

  // Collaborators Modal
  const [isCollaboratorsModalOpen, setIsCollaboratorsModalOpen] = useState(false);
  const [selectedCollaboratorEmail, setSelectedCollaboratorEmail] = useState('');
  const [collaboratorLoading, setCollaboratorLoading] = useState(false);

  const isManagerOrAdmin = ['admin', 'manager'].includes(currentUser?.role);

  const loadProjectAndTasks = async () => {
    try {
      setLoading(true);
      const projData = await projectService.getProject(id);
      const tasksData = await taskService.getTasksByProject(id);
      const usersData = await authService.getCompanyUsers();

      setProject(projData);
      setTasks(tasksData);
      setCompanyUsers(usersData);

      // Prepopulate edit project states
      setEditName(projData.name);
      setEditDesc(projData.description || '');
      setEditStatus(projData.status);
      setEditDueDate(projData.dueDate ? projData.dueDate.split('T')[0] : '');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load workspace data.');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectAndTasks();
  }, [id]);

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!isManagerOrAdmin) {
      toast.error('Only administrators or managers can edit workspace parameters.');
      return;
    }
    try {
      const updated = await projectService.updateProject(id, {
        name: editName,
        description: editDesc,
        status: editStatus,
        dueDate: editDueDate || undefined,
      });
      setProject(updated);
      setIsEditProjectOpen(false);
      toast.success('Workspace settings updated!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update workspace settings.');
    }
  };

  const handleDeleteProject = async () => {
    if (!isManagerOrAdmin) {
      toast.error('Only administrators or managers can remove workspaces.');
      return;
    }
    if (window.confirm('WARNING: Are you absolutely sure you want to delete this workspace and all associated tasks? This cannot be undone.')) {
      try {
        await projectService.deleteProject(id);
        toast.success('Workspace removed successfully.');
        navigate('/projects');
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to delete project workspace.');
      }
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!selectedCollaboratorEmail) {
      toast.error('Please select a teammate to add.');
      return;
    }
    try {
      setCollaboratorLoading(true);
      const updated = await projectService.addMember(id, selectedCollaboratorEmail);
      setProject(updated);
      setSelectedCollaboratorEmail('');
      toast.success('Collaborator added to workspace successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add collaborator.');
    } finally {
      setCollaboratorLoading(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      const updated = await projectService.removeMember(id, userId);
      setProject(updated);
      toast.success('Collaborator removed from workspace.');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to remove collaborator.');
    }
  };

  // KANBAN ACTIONS
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!isManagerOrAdmin) {
      toast.error('Only administrators or managers can save task details.');
      return;
    }
    if (!taskTitle) {
      toast.error('Task title is required');
      return;
    }

    try {
      setTaskLoading(true);
      const data = {
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        priority: taskPriority,
        projectId: id,
        assignedTo: taskAssignee || undefined,
        dueDate: taskDueDate || undefined,
      };

      if (activeTaskId) {
        // Edit Mode
        const updatedTask = await taskService.updateTask(activeTaskId, data);
        setTasks(tasks.map((t) => (t._id === activeTaskId ? updatedTask : t)));
        toast.success('Task updated successfully!');
      } else {
        // Create Mode
        const newTask = await taskService.createTask(data);
        setTasks([...tasks, newTask]);
        toast.success('Task created and added to board!');
      }

      closeTaskModal();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save task.');
    } finally {
      setTaskLoading(false);
    }
  };

  const openTaskModal = (statusValue, existingTask = null) => {
    if (!isManagerOrAdmin) {
      toast.error('Members cannot modify task details.');
      return;
    }
    if (existingTask) {
      // Editing
      setActiveTaskId(existingTask._id);
      setTaskTitle(existingTask.title);
      setTaskDesc(existingTask.description || '');
      setTaskPriority(existingTask.priority);
      setTaskStatus(existingTask.status);
      setTaskAssignee(existingTask.assignedTo?._id || existingTask.assignedTo || '');
      setTaskDueDate(existingTask.dueDate ? existingTask.dueDate.split('T')[0] : '');
    } else {
      // Creating
      setActiveTaskId(null);
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('medium');
      setTaskStatus(statusValue);
      setTaskAssignee('');
      setTaskDueDate('');
    }
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setActiveTaskId(null);
  };

  const handleTaskStatusShift = async (taskId, currentStatus, direction, assignedUserId) => {
    // SECURITY RULE: check permissions
    const isAssignedMember = assignedUserId && assignedUserId.toString() === currentUser?._id;
    if (!isManagerOrAdmin && !isAssignedMember) {
      toast.error('You can only update the status of tasks assigned specifically to you.');
      return;
    }

    const lanes = ['todo', 'in-progress', 'review', 'done'];
    const currentIndex = lanes.indexOf(currentStatus);
    let nextIndex = currentIndex + direction;

    if (nextIndex >= 0 && nextIndex < lanes.length) {
      const nextStatus = lanes[nextIndex];
      try {
        // Optimistic UI Update for instant feel!
        setTasks(tasks.map((t) => (t._id === taskId ? { ...t, status: nextStatus } : t)));
        await taskService.updateTask(taskId, { status: nextStatus });
        toast.success(`Task shifted to ${nextStatus.toUpperCase()}`);
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to shift task status.');
        loadProjectAndTasks();
      }
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!isManagerOrAdmin) {
      toast.error('Members cannot remove tasks from board.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(taskId);
        setTasks(tasks.filter((t) => t._id !== taskId));
        toast.success('Task removed from board.');
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to remove task.');
      }
    }
  };

  // Helper filters
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

  const getAvatarLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

  if (loading) {
    return <LoadingSpinner />;
  }

  const isOwner = project?.owner?._id === currentUser?._id || project?.owner === currentUser?._id;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto font-sans animate-fade-in">
      {/* Upper Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
            Project Board
          </span>
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2.5 text-gradient-premium">
            <FiFolder className="text-primary-400 w-5 h-5" />
            {project?.name}
          </h1>
          <p className="text-slate-400 text-xs font-light mt-1.5 max-w-2xl leading-relaxed">
            {project?.description || 'No description provided for this board.'}
          </p>
        </div>

        {/* Dashboard Settings Controls */}
        <div className="flex items-center gap-2">
          {/* Members List avatars */}
          <div className="flex items-center -space-x-1.5 mr-2">
            {project?.members?.slice(0, 5).map((m) => (
              <div
                key={m._id}
                title={`${m.name} (${m.email})`}
                className="w-7 h-7 rounded-full border-2 border-slate-950 flex items-center justify-center font-bold text-white text-[9px] shadow-sm animate-fade-in"
                style={{ backgroundColor: m.avatarColor || '#8b5cf6' }}
              >
                {getAvatarLetter(m.name)}
              </div>
            ))}
            {project?.members?.length > 5 && (
              <div className="w-7 h-7 rounded-full border-2 border-slate-950 bg-slate-900 text-[9px] text-slate-400 font-bold flex items-center justify-center shadow-sm">
                +{project.members.length - 5}
              </div>
            )}
          </div>

          {isManagerOrAdmin && (
            <button
              onClick={() => setIsCollaboratorsModalOpen(true)}
              className="p-2.5 rounded-xl border border-slate-900 text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors cursor-pointer mr-1"
              title="Manage Collaborators"
            >
              <FiUserPlus className="w-4 h-4" />
            </button>
          )}

          {isManagerOrAdmin && (
            <button
              onClick={() => setIsEditProjectOpen(true)}
              className="p-2.5 rounded-xl border border-slate-900 text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors cursor-pointer mr-1"
              title="Edit Workspace Settings"
            >
              <FiEdit className="w-4 h-4" />
            </button>
          )}

          {isManagerOrAdmin && isOwner && (
            <button
              onClick={handleDeleteProject}
              className="p-2.5 rounded-xl border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete Workspace"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* board lanes layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start mt-2">
        {/* LANES COMPILATION */}
        {[
          { key: 'todo', title: 'To Do', border: 'border-slate-900' },
          { key: 'in-progress', title: 'In Progress', border: 'border-primary-500/20' },
          { key: 'review', title: 'In Review', border: 'border-indigo-500/20' },
          { key: 'done', title: 'Completed', border: 'border-emerald-500/20' },
        ].map((lane) => {
          const laneTasks = getTasksByLane(lane.key);
          return (
            <div
              key={lane.key}
              className={`flex flex-col gap-4 rounded-2xl bg-slate-950/40 border ${lane.border} p-4 shadow-sm backdrop-blur-md`}
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
                {isManagerOrAdmin && (
                  <button
                    onClick={() => openTaskModal(lane.key)}
                    className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                    title="Add task to lane"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Lane Cards list container */}
              <div className="flex flex-col gap-3 min-h-[300px] overflow-y-auto max-h-[500px] pr-1">
                {laneTasks.length === 0 ? (
                  <div className="my-auto flex items-center justify-center">
                    <p className="text-slate-400 text-xs uppercase tracking-widest font-bold text-center">
                      Empty Lane
                    </p>
                  </div>
                ) : (
                  laneTasks.map((task) => {
                    const taskAssignedId = task.assignedTo?._id || task.assignedTo;
                    const isAssigned = taskAssignedId && taskAssignedId.toString() === currentUser?._id;
                    const canShift = isManagerOrAdmin || isAssigned;

                    return (
                      <div
                        key={task._id}
                        className="glass-panel rounded-xl p-4 border border-white/5 shadow-md flex flex-col gap-4 group relative overflow-hidden"
                      >
                        <div className="flex flex-col gap-2.5">
                          <div className="flex justify-between items-start gap-2">
                            <span
                              className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>

                            {/* Quick controls */}
                            {isManagerOrAdmin && (
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200">
                                <button
                                  onClick={() => openTaskModal(lane.key, task)}
                                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
                                  title="Edit Task"
                                >
                                  <FiEdit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleTaskDelete(task._id)}
                                  className="p-1 rounded text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                  title="Delete Task"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <h4 className="text-white font-extrabold text-sm leading-snug group-hover:text-primary-300 transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-slate-300 text-xs font-normal leading-relaxed line-clamp-2 mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Card Footer details */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/50 pt-3 text-xs text-slate-400">
                          {/* Assignee display */}
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {task.assignedTo ? (
                              <>
                                <div
                                  className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-white text-[9px]"
                                  style={{ backgroundColor: task.assignedTo.avatarColor || '#6366f1' }}
                                  title={task.assignedTo.name}
                                >
                                  {getAvatarLetter(task.assignedTo.name)}
                                </div>
                                <span className="truncate text-slate-200 font-medium text-xs max-w-[85px]">
                                  {task.assignedTo.name}
                                </span>
                              </>
                            ) : (
                              <span className="italic text-slate-400 text-xs">Unassigned</span>
                            )}
                          </div>

                          {/* Lane Quick status shifters */}
                          {canShift && (
                            <div className="flex items-center gap-1">
                              <button
                                disabled={lane.key === 'todo'}
                                onClick={() => handleTaskStatusShift(task._id, lane.key, -1, taskAssignedId)}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 disabled:opacity-30 cursor-pointer"
                              >
                                <FiChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                disabled={lane.key === 'done'}
                                onClick={() => handleTaskStatusShift(task._id, lane.key, 1, taskAssignedId)}
                                className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 disabled:opacity-30 cursor-pointer"
                              >
                                <FiChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>



      {/* EDIT WORKSPACE SETTINGS MODAL */}
      {isEditProjectOpen && isManagerOrAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div onClick={() => setIsEditProjectOpen(false)} className="absolute inset-0"></div>
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl relative z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-slate-900 pb-3">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <FiEdit className="text-primary-400" />
                Edit Workspace Settings
              </h3>
              <button onClick={() => setIsEditProjectOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="modern-input"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="modern-input resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="modern-input cursor-pointer"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="modern-input cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditProjectOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-1.5 cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                  Save Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK EDIT / CREATION DIALOG POPUP */}
      {isTaskModalOpen && isManagerOrAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div onClick={closeTaskModal} className="absolute inset-0"></div>
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl relative z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-5 border-b border-slate-900 pb-3">
              <h3 className="text-white font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                <FiPlus className="text-primary-400 w-4 h-4" />
                {activeTaskId ? 'Edit Backlog Task' : 'Add Backlog Task'}
              </h3>
              <button onClick={closeTaskModal} className="text-slate-400 hover:text-white cursor-pointer">
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="flex flex-col gap-4">
              {/* Task Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design responsive UI cards"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="modern-input"
                />
              </div>

              {/* Task Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                  Task Description
                </label>
                <textarea
                  placeholder="Detail the sprint expectations and criteria..."
                  rows="3"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="modern-input resize-none"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="modern-input cursor-pointer"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    Backlog Lane Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="modern-input cursor-pointer"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Completed</option>
                  </select>
                </div>
              </div>

              {/* Assignee & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    Task Assignee
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="modern-input cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {companyUsers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    Task Target Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="modern-input cursor-pointer"
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 mt-4 border-t border-slate-900 pt-4">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                >
                  {taskLoading ? 'Saving...' : activeTaskId ? 'Save Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLABORATORS MODAL */}
      {isCollaboratorsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          {/* Backdrop trigger close */}
          <div onClick={() => setIsCollaboratorsModalOpen(false)} className="absolute inset-0"></div>

          {/* Dialog Container */}
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 p-6 shadow-2xl relative z-10 animate-slide-in">
            <div className="flex items-center justify-between mb-5 border-b border-slate-800/80 pb-3">
              <h3 className="text-white font-extrabold text-base flex items-center gap-2 uppercase tracking-wide">
                <FiUsers className="text-primary-400 w-5 h-5" />
                Workspace Collaborators
              </h3>
              <button
                onClick={() => setIsCollaboratorsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Current Collaborators List */}
            <div className="flex flex-col gap-3 mb-6">
              <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider block">
                Active Collaborators ({project?.members?.length || 0})
              </span>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {project?.members?.map((member) => {
                  const isProjectOwner = project?.owner?._id === member._id || project?.owner === member._id;
                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-[10px]"
                          style={{ backgroundColor: member.avatarColor || '#6366f1' }}
                        >
                          {getAvatarLetter(member.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                            {member.name}
                            {isProjectOwner && (
                              <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold uppercase">
                                Owner
                              </span>
                            )}
                          </span>
                          <span className="text-slate-500 text-[10px]">{member.email}</span>
                        </div>
                      </div>
                      
                      {/* Remove collaborator button */}
                      {isManagerOrAdmin && !isProjectOwner && (
                        <button
                          onClick={() => handleRemoveCollaborator(member._id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove from Workspace"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Collaborator Form */}
            {isManagerOrAdmin && (
              <form onSubmit={handleAddCollaborator} className="border-t border-slate-800/80 pt-4 flex flex-col gap-3">
                <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider block">
                  Add Collaborator
                </span>
                <div className="flex gap-2">
                  <select
                    value={selectedCollaboratorEmail}
                    onChange={(e) => setSelectedCollaboratorEmail(e.target.value)}
                    className="flex-grow px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-primary-500 cursor-pointer"
                  >
                    <option value="">Choose a teammate...</option>
                    {companyUsers
                      .filter((cu) => !project?.members?.some((m) => m._id === cu._id))
                      .map((cu) => (
                        <option key={cu._id} value={cu.email}>
                          {cu.name} ({cu.email})
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={collaboratorLoading}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-primary-600/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {collaboratorLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
