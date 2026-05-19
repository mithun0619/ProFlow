const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin/Manager only)
const createProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, dueDate } = req.body;

    if (!name) {
      res.status(400);
      throw new Error('Project name is required');
    }

    const project = await Project.create({
      name,
      description,
      status: status || 'planning',
      priority: priority || 'medium',
      dueDate,
      owner: req.user.id,
      createdBy: req.user.id,
      companyId: req.user.companyId,
      members: [req.user.id], // Creator is automatically a member
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all projects (Scoped by Company and Role)
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res, next) => {
  try {
    let query = { companyId: req.user.companyId };

    // If user is a member, they can only see projects they are assigned to
    if (req.user.role === 'member') {
      query.members = req.user.id;
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatarColor role')
      .populate('members', 'name email avatarColor role')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatarColor role')
      .populate('members', 'name email avatarColor role');

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify company scope
    if (project.companyId.toString() !== req.user.companyId.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this project workspace');
    }

    // If user is a member, check if they are in the project's member list
    if (req.user.role === 'member') {
      const isMember = project.members.some(
        (m) => m._id.toString() === req.user.id
      );
      if (!isMember) {
        res.status(403);
        throw new Error('Not authorized to access this project workspace');
      }
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/Manager only)
const updateProject = async (req, res, next) => {
  try {
    const { name, description, status, priority, dueDate } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify company scope
    if (project.companyId.toString() !== req.user.companyId.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify this project');
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description, status, priority, dueDate },
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email avatarColor role')
      .populate('members', 'name email avatarColor role');

    res.json(project);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin/Manager only)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify company scope
    if (project.companyId.toString() !== req.user.companyId.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this project');
    }

    // Remove all tasks associated with this project
    await Task.deleteMany({ projectId: req.params.id });

    // Remove the project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project workspace and all related tasks removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin/Manager only)
const addProjectMember = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Member email is required');
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify company scope
    if (project.companyId.toString() !== req.user.companyId.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify members for this project');
    }

    // Find user by email inside this company
    const userToAdd = await User.findOne({
      email: email.toLowerCase(),
      companyId: req.user.companyId,
    });

    if (!userToAdd) {
      res.status(404);
      throw new Error('User not found with this email in your company workspace');
    }

    // Check if user is already a member
    const alreadyMember = project.members.includes(userToAdd._id);
    if (alreadyMember) {
      res.status(400);
      throw new Error('User is already a member of this project');
    }

    // Add member
    project.members.push(userToAdd._id);
    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email avatarColor role')
      .populate('members', 'name email avatarColor role');

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin/Manager only)
const removeProjectMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    // Verify company scope
    if (project.companyId.toString() !== req.user.companyId.toString()) {
      res.status(403);
      throw new Error('Not authorized to modify members for this project');
    }

    const { userId } = req.params;

    // Cannot remove owner/createdBy
    if (project.owner.toString() === userId.toString()) {
      res.status(400);
      throw new Error('Cannot remove the project owner from members list');
    }

    // Pull member
    project.members.pull(userId);
    await project.save();

    // Reassign all active tasks assigned to this user in this project
    await Task.updateMany(
      { projectId: project._id, assignedTo: userId },
      { $unset: { assignedTo: 1 } }
    );

    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email avatarColor role')
      .populate('members', 'name email avatarColor role');

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};
