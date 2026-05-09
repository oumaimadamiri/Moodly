import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token ajouté à la requête');
    } else {
      console.warn('⚠️ Aucun token trouvé dans le localStorage');
    }
    
    // Pour FormData, laisser le navigateur gérer le Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.data && typeof config.data === 'object') {
      config.headers['Content-Type'] = 'application/json';
    }
    
    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer le refresh token
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error(`❌ ${error.response?.status} ${error.config?.url}:`, error.response?.data);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Tentative de rafraîchissement du token...');
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        console.log('✅ Token rafraîchi avec succès');

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Échec du rafraîchissement du token:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== STORIES ====================
export const storiesAPI = {
  getFeed: () => {
    console.log('📸 Récupération du feed des stories...');
    return api.get('/stories/feed/');
  },
  
  getMyStories: () => {
    console.log('📸 Récupération de mes stories...');
    return api.get('/stories/my_stories/');
  },
  
  create: (formData) => {
    console.log('📤 Création d\'une story...');
    
    // Debug: Afficher le contenu du FormData
    for (let [key, value] of formData.entries()) {
      console.log(`📋 ${key}:`, value);
    }
    
    return api.post('/stories/', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
  },
  
  view: (storyId) => {
    console.log(`👀 Marquer la story ${storyId} comme vue`);
    return api.post(`/stories/${storyId}/view/`);
  },
  
  react: (storyId, data) => {
    console.log(`❤️ Réaction à la story ${storyId}:`, data);
    return api.post(`/stories/${storyId}/react/`, data);
  },
  
  delete: (storyId) => {
    console.log(`🗑️ Suppression de la story ${storyId}`);
    return api.delete(`/stories/${storyId}/`);
  },
  
  getViews: (storyId) => api.get(`/stories/${storyId}/views/`),
  getReplies: (storyId) => api.get(`/stories/${storyId}/replies/`),
};

// ==================== AUTH ====================
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  verifyEmail: (data) => api.post('/auth/verify-email/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/users/me/'),
  updateProfile: (data) => api.patch('/users/me/', data),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getAll: () => api.get('/notifications/'),
  getUnreadCount: () => api.get('/notifications/unread-count/'),
  markAsRead: (id) => api.patch(`/notifications/${id}/`, { read: true }),
  markAllAsRead: () => api.post('/notifications/mark-all-read/'),
  delete: (id) => api.delete(`/notifications/${id}/`),
};

// ==================== MESSAGES ====================
export const messagesAPI = {
  getConversations: () => api.get('/conversations/'),
  getUnreadCount: () => api.get('/messages/unread-count/'),
  getMessages: (conversationId) => api.get(`/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId, data) => api.post(`/conversations/${conversationId}/send_message/`, data),
  createConversation: (userId) => api.post('/conversations/', { participant_id: userId }),
  deleteConversation: (conversationId) => api.delete(`/conversations/${conversationId}/`),
  markAsRead: (conversationId) => api.post(`/conversations/${conversationId}/mark-read/`),
  
  getAudioFile: (audioPath) => {
    const fullUrl = audioPath.startsWith('http') 
      ? audioPath 
      : `http://localhost:8000${audioPath}`;
    
    return axios.get(fullUrl, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      }
    });
  },
  
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}/`);
    return response;
  },
  
  deleteMessageForEveryone: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}/delete_for_everyone/`);
    return response;
  }
};

// ==================== STORY NOTIFICATIONS ====================
export const storyNotificationsAPI = {
  getAll: () => api.get('/story-notifications/'),
  markAsRead: (id) => api.post(`/story-notifications/${id}/mark_as_read/`),
  markAllAsRead: () => api.post('/story-notifications/mark_all_as_read/'),
};

// ==================== USERS ====================
export const usersAPI = {
  getProfile: (username) => api.get(`/users/profile/${username}/`),
  updateProfile: (data) => api.patch('/users/me/', data),
  follow: (username) => api.post(`/users/${username}/follow/`),
  unfollow: (username) => api.delete(`/users/${username}/unfollow/`),
  getFollowers: (username) => api.get(`/users/${username}/followers/`),
  getFollowing: (username) => api.get(`/users/${username}/following/`),
  getFollowRequests: () => api.get('/follow-requests/pending_requests/'),
  acceptFollowRequest: (userId) => api.post(`/follow-requests/${userId}/accept/`),
  rejectFollowRequest: (userId) => api.post(`/follow-requests/${userId}/reject/`),
  cancelFollowRequest: (username) => api.delete(`/users/${username}/cancel-follow-request/`),
  updatePrivacySettings: (data) => api.put('/privacy-settings/settings/', data),
  search: (query) => api.get(`/users/search/?q=${encodeURIComponent(query)}`),
  suggestions: () => api.get('/users/suggestions/'),
  deactivateAccount: () => api.post('/users/me/deactivate/'),
  deleteAccount: (data) => api.post('/users/me/delete/', data),
  changePassword: (data) => api.post('/users/me/change_password/', data),
  getLinkedAccounts: () => api.get('/users/linked_accounts/'),
  switchAccount: (username) => api.post('/users/switch_account/', { username }),
  createLinkedAccount: (data) => api.post('/users/create_linked_account/', data)
};

// ==================== POSTS ====================
export const postsAPI = {
  getAll: (page = 1) => api.get(`/posts/?page=${page}`),
  getById: (id) => api.get(`/posts/${id}/`),
  create: (data) => api.post('/posts/', data),
  update: (id, data) => api.patch(`/posts/${id}/`, data),
  delete: (id) => api.delete(`/posts/${id}/`),
  like: (id) => api.post(`/posts/${id}/like/`),
  unlike: (id) => api.delete(`/posts/${id}/unlike/`),
  getComments: (id) => api.get(`/posts/${id}/comments/`),
  getLikes: (id) => api.get(`/posts/${id}/likes/`),
};

// ==================== COMMENTS ====================
export const commentsAPI = {
  getByPost: (postId) => api.get(`/posts/${postId}/comments/`),
  create: (postId, data) => api.post(`/comments/`, { ...data, post: postId }),
  update: (id, data) => api.patch(`/comments/${id}/`, data),
  delete: (id) => api.delete(`/comments/${id}/`),
};

export default api;