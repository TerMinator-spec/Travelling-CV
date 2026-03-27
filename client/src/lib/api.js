const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tcv_token') : null;
  
  const headers = {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const api = {
  signup: (data) => request('/auth/signup', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  googleAuth: (data) => request('/auth/google', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),

  // Profile
  getMyProfile: () => request('/profile/me'),
  getProfile: (userId) => request(`/profile/${userId}`),
  updateProfile: (data) => request('/profile/me', { method: 'PUT', body: data }),
  uploadAvatar: (formData) => request('/profile/avatar', { method: 'POST', body: formData }),
  addTravelHistory: (formData) => request('/profile/travel-history', { method: 'POST', body: formData }),
  deleteTravelHistory: (id) => request(`/profile/travel-history/${id}`, { method: 'DELETE' }),
  uploadGalleryImage: (formData) => request('/profile/gallery', { method: 'POST', body: formData }),
  deleteGalleryImage: (id) => request(`/profile/gallery/${id}`, { method: 'DELETE' }),
  getTravelers: (params) => request(`/profile?${new URLSearchParams(params)}`),

  // Posts
  createPost: (formData) => request('/posts', { method: 'POST', body: formData }),
  getFeed: (params = {}) => request(`/posts/feed?${new URLSearchParams(params)}`),
  getPost: (id) => request(`/posts/${id}`),
  likePost: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
  commentPost: (id, content) => request(`/posts/${id}/comment`, { method: 'POST', body: { content } }),
  savePost: (id) => request(`/posts/${id}/save`, { method: 'POST' }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  getSavedPosts: () => request('/posts/user/saved'),

  // Groups
  createGroup: (data) => request('/groups', { method: 'POST', body: data }),
  getGroups: (params = {}) => request(`/groups?${new URLSearchParams(params)}`),
  getGroup: (id) => request(`/groups/${id}`),
  joinGroup: (id) => request(`/groups/${id}/join`, { method: 'POST' }),
  leaveGroup: (id) => request(`/groups/${id}/leave`, { method: 'POST' }),
  postInGroup: (id, content) => request(`/groups/${id}/posts`, { method: 'POST', body: { content } }),

  // Messages
  getConversations: () => request('/messages/conversations'),
  getMessages: (userId) => request(`/messages/user/${userId}`),
  sendMessage: (data) => request('/messages', { method: 'POST', body: data }),
  getGroupMessages: (groupId) => request(`/messages/group/${groupId}`),

  // Discover
  discoverTravelers: (params = {}) => request(`/discover?${new URLSearchParams(params)}`),
  getCompatibility: (userId) => request(`/discover/compatibility/${userId}`),
  search: (params) => request(`/discover/search?${new URLSearchParams(params)}`),
  geocode: (query) => request(`/discover/geocode?q=${encodeURIComponent(query)}`),

  // Collaboration
  sendJoinRequest: (data) => request('/collaboration/join-request', { method: 'POST', body: data }),
  getJoinRequests: (postId) => request(`/collaboration/join-requests/${postId}`),
  respondJoinRequest: (id, status) => request(`/collaboration/join-request/${id}`, { method: 'PUT', body: { status } }),
  getMyRequests: () => request('/collaboration/my-requests'),

  // Moderation
  reportPost: (data) => request('/moderation/report', { method: 'POST', body: data }),
  getReports: () => request('/moderation/reports'),
  moderatePost: (postId, action) => request(`/moderation/moderate/${postId}`, { method: 'PUT', body: { action } }),
  getAdminStats: () => request('/moderation/stats'),
};
