const express = require('express');
const router = express.Router();
const {
  registerWorkspace,
  loginUser,
  getMe,
  updateProfile,
  getCompanyUsers,
  inviteUser,
  removeUser,
  verifyInviteToken,
  acceptInvite,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/register-workspace', registerWorkspace);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, getCompanyUsers);

// Public Invitation endpoints
router.post('/verify-invite-token', verifyInviteToken);
router.post('/accept-invite', acceptInvite);

// Only admins can invite/create users or remove them
router.post('/invite', protect, authorizeRoles('admin'), inviteUser);
router.delete('/users/:id', protect, authorizeRoles('admin'), removeUser);

module.exports = router;
