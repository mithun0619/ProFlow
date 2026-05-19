import api from './api';

const taskService = {
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  getTasksByProject: async (projectId) => {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  },

  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  getCompanyTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },
};

export default taskService;
