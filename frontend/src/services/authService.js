import api from './api';

const authService = {
  // Register a new company workspace along with admin user
  registerWorkspace: async (companyName, companyEmail, adminName, adminEmail, adminPassword) => {
    const response = await api.post('/auth/register-workspace', {
      companyName,
      companyEmail,
      adminName,
      adminEmail,
      adminPassword,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Login with Company Code + Email + Password
  login: async (companyCode, email, password) => {
    const response = await api.post('/auth/login', {
      companyCode,
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Log out current session
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user session
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile name or password
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Get all teammates in company
  getCompanyUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  // Invite/Create a new user (Admin-only backend check)
  inviteUser: async (userData) => {
    const response = await api.post('/auth/invite', userData);
    return response.data;
  },

  // Remove a user from the workspace (Admin-only backend check)
  deleteUser: async (id) => {
    const response = await api.delete(`/auth/users/${id}`);
    return response.data;
  },

  // Verify secure invite token details
  verifyInviteToken: async (token) => {
    const response = await api.post('/auth/verify-invite-token', { token });
    return response.data;
  },

  // Accept workspace invite & save credentials
  acceptInvite: async (token, password) => {
    const response = await api.post('/auth/accept-invite', { token, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
};

export default authService;
