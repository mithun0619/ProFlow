const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get all projects - accessible by all protected users
router.get('/', protect, getProjects);

// Get project by ID - accessible by all protected users (controller scopes members checks)
router.get('/:id', protect, getProjectById);

// Project write actions - restricted to admin/manager
router.post('/', protect, authorizeRoles('admin', 'manager'), createProject);
router.put('/:id', protect, authorizeRoles('admin', 'manager'), updateProject);
router.delete('/:id', protect, authorizeRoles('admin', 'manager'), deleteProject);

// Project member management - restricted to admin/manager
router.post('/:id/members', protect, authorizeRoles('admin', 'manager'), addProjectMember);
router.delete('/:id/members/:userId', protect, authorizeRoles('admin', 'manager'), removeProjectMember);

module.exports = router;
