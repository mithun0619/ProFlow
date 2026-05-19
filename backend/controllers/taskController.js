const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper to write in-app notifications
const triggerNotification = async (userId, message) => {
  try {
    if (userId) {
      await Notification.create({ userId, message });
    }
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin/Manager only)
const createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;

    if (!title || !projectId) {
      res.status(400);
      throw new Error('Please add a task title and specify a project');
    }

    // Verify project belongs to user's company
    const project = await Project.findOne({
      _id: projectId,
      companyId: req.user.companyId,
    });

    if (!project) {
      res.status(404);
      throw new Error('Project not found in your company workspace');
    }

    // If assignedTo is provided, verify they belong to same company
    if (assignedTo) {
      const assigneeUser = await User.findOne({ _id: assignedTo, companyId: req.user.companyId });
      if (!assigneeUser) {
        res.status(400);
        throw new Error('Assigned user does not belong to your company');
      }

      // Automatically add assignee to project members if not already there
      if (!project.members.includes(assignedTo)) {
        project.members.push(assignedTo);
        await project.save();
      }
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
      status: status || 'todo',
      dueDate,
      createdBy: req.user.id,
      companyId: req.user.companyId,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email avatarColor role')
      .populate('projectId', 'name');

    // Trigger Notification for Assignee
    if (assignedTo) {
      await triggerNotification(
        assignedTo,
        `Task "${title}" has been assigned to you in project "${project.name}"`
      );
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks for a specific project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify project scope & authorization
    const project = await Project.findOne({
      _id: projectId,
      companyId: req.user.companyId,
    });

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // If user is member, they must be part of project members list
    if (req.user.role === 'member') {
      const isMember = project.members.some((m) => m.toString() === req.user.id);
      if (!isMember) {
        res.status(403);
        throw new Error('Not authorized to access tasks for this project');
      }
    }

    const tasks = await Task.find({ projectId, companyId: req.user.companyId })
      .populate('assignedTo', 'name email avatarColor role')
      .sort({ createdAt: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tasks inside user's company (for master list / filters)
// @route   GET /api/tasks
// @access  Private
const getCompanyTasks = async (req, res, next) => {
  try {
    let query = { companyId: req.user.companyId };

    // If member, only list tasks assigned to them
    if (req.user.role === 'member') {
      query.assignedTo = req.user.id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatarColor role')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details or status
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Verify company scope
    if (task.companyId.toString() !== req.user.companyId.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this task');
    }

    const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

    // SECURITY RULE: Members can ONLY update task status and ONLY if assigned to them
    if (!isManagerOrAdmin) {
      if (!task.assignedTo || task.assignedTo.toString() !== req.user.id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this task status (Only assigned member can update status)');
      }

      // Check if trying to update fields other than status
      const fieldsToChange = Object.keys(req.body);
      const isTryingToChangeDetails = fieldsToChange.some((f) => f !== 'status');

      if (isTryingToChangeDetails) {
        res.status(403);
        throw new Error('Members are only authorized to update task status, not details or assignments');
      }
    }

    // Capture old assignee
    const oldAssignee = task.assignedTo ? task.assignedTo.toString() : null;

    // Perform updates
    const updateData = {};
    if (status !== undefined) updateData.status = status;

    if (isManagerOrAdmin) {
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo || null;

        // Automatically add assignee to project members if not already there
        if (assignedTo) {
          const project = await Project.findById(task.projectId);
          if (project && !project.members.includes(assignedTo)) {
            project.members.push(assignedTo);
            await project.save();
          }
        }
      }
      if (dueDate !== undefined) updateData.dueDate = dueDate;
    }

    task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('assignedTo', 'name email avatarColor role')
      .populate('projectId', 'name');

    // Trigger Notification for assignment changes
    if (isManagerOrAdmin && assignedTo && assignedTo.toString() !== oldAssignee) {
      await triggerNotification(
        assignedTo,
        `Task "${task.title}" has been assigned to you in project "${task.projectId?.name}"`
      );
    }

    // Trigger Notification for status updates
    if (status && status !== task.status) {
      // If updated by member, notify manager/creator
      if (!isManagerOrAdmin) {
        await triggerNotification(
          task.createdBy,
          `Teammate ${req.user.name} updated status of task "${task.title}" to "${status.toUpperCase()}"`
        );
      } else if (task.assignedTo && task.assignedTo._id.toString() !== req.user.id.toString()) {
        // If updated by admin/manager, notify assignee
        await triggerNotification(
          task.assignedTo._id,
          `Manager updated status of your task "${task.title}" to "${status.toUpperCase()}"`
        );
      }
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin/Manager only)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Verify company scope
    if (task.companyId.toString() !== req.user.companyId.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this task');
    }

    // Delete task
    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted successfully from board' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  getCompanyTasks,
  updateTask,
  deleteTask,
};
