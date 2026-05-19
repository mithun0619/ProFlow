const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasksByProject,
  getCompanyTasks,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Get all company/member tasks
router.get('/', protect, getCompanyTasks);

// Get tasks by project
router.get('/project/:projectId', protect, getTasksByProject);

// Create task - restricted to admin/manager
router.post('/', protect, authorizeRoles('admin', 'manager'), createTask);

// Update task status/details - accessible by all (controller handles authorization checks)
router.put('/:id', protect, updateTask);

// Delete task - restricted to admin/manager
router.delete('/:id', protect, authorizeRoles('admin', 'manager'), deleteTask);

module.exports = router;
