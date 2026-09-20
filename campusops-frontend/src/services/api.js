import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5001/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

export default API;

// Task endpoints
export const getTasks = () => API.get('/tasks');
export const getUsers = () => API.get('/tasks/users');
export const createTask = (data) => API.post('/tasks', data);
export const updateTaskStatus = (id, status) => API.put(`/tasks/${id}/status`, { status });
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// Event endpoints
export const getEvents = () => API.get('/events');
export const getEventById = (id) => API.get(`/events/${id}`);
export const createEvent = (data) => API.post('/events', data);
export const updateEvent = (id, data) => API.put(`/events/${id}`, data);
export const deleteEvent = (id) => API.delete(`/events/${id}`);

// Budget endpoints
export const getBudgetEntries = () => API.get('/budget');
export const getBudgetSummary = () => API.get('/budget/summary');
export const createBudgetEntry = (data) => API.post('/budget', data);
export const deleteBudgetEntry = (id) => API.delete(`/budget/${id}`);

// Comment endpoints
export const getComments = (taskId) => API.get(`/comments/${taskId}`);
export const addComment = (taskId, content) => API.post(`/comments/${taskId}`, { content });
export const deleteComment = (id) => API.delete(`/comments/${id}`);

// Note endpoints
export const getNotes = () => API.get('/notes');
export const createNote = (data) => API.post('/notes', data);
export const updateNote = (id, data) => API.put(`/notes/${id}`, data);
export const deleteNote = (id) => API.delete(`/notes/${id}`);

// Dashboard stats
export const getDashboardStats = () => Promise.all([
  API.get('/tasks'),
  API.get('/events'),
  API.get('/budget/summary'),
]);

export const getCommitteeStats = () => API.get('/tasks/users');

// Attempt endpoints
export const getAttempts = (taskId) => API.get(`/attempts/${taskId}`);
export const saveAttempt = (taskId, content) => API.post(`/attempts/${taskId}`, { content });
export const deleteAttempt = (id) => API.delete(`/attempts/${id}`);

// Members endpoints
export const getMembers = () => API.get('/auth/members');
export const updateMemberRole = (id, role) => API.put(`/auth/members/${id}/role`, { role });