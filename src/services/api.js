// TripMate REST API Client Service
// Connects React frontend with Node.js/Express backend

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'tripmate_auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

// Generalized fetch wrapper with Bearer token injection and error handling
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // If 401 Unauthorized, token is expired or invalid
      if (res.status === 401) {
        removeToken();
        window.dispatchEvent(new CustomEvent('tripmate:auth-expired'));
      }
      const message = data.message || `Request failed with status ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Network unreachable or backend server offline
      const netError = new Error('Cannot connect to TripMate backend server. Is the Node.js server running on port 5000?');
      netError.isNetworkError = true;
      throw netError;
    }
    throw error;
  }
}

export const api = {
  // Server Health
  health: {
    check: () => request('/health', { method: 'GET' }),
  },

  // Authentication
  auth: {
    register: (userData) =>
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),

    getMe: () => request('/auth/me', { method: 'GET' }),

    updateProfile: (profileData) =>
      request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),

    logout: () => {
      removeToken();
      return Promise.resolve({ success: true });
    },
  },

  // Journeys & Multi-modal Trip Chains
  journeys: {
    getAll: () => request('/journeys', { method: 'GET' }),

    getById: (id) => request(`/journeys/${id}`, { method: 'GET' }),

    create: (journeyData) =>
      request('/journeys', {
        method: 'POST',
        body: JSON.stringify(journeyData),
      }),

    update: (id, journeyData) =>
      request(`/journeys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(journeyData),
      }),

    delete: (id) =>
      request(`/journeys/${id}`, {
        method: 'DELETE',
      }),

    // Segments inside a journey
    addSegment: (journeyId, segmentData) =>
      request(`/journeys/${journeyId}/segments`, {
        method: 'POST',
        body: JSON.stringify(segmentData),
      }),

    updateSegment: (journeyId, segmentId, segmentData) =>
      request(`/journeys/${journeyId}/segments/${segmentId}`, {
        method: 'PUT',
        body: JSON.stringify(segmentData),
      }),

    deleteSegment: (journeyId, segmentId) =>
      request(`/journeys/${journeyId}/segments/${segmentId}`, {
        method: 'DELETE',
      }),
  },

  // Saved Places & Safe Zones
  savedPlaces: {
    getAll: () => request('/saved-places', { method: 'GET' }),

    create: (placeData) =>
      request('/saved-places', {
        method: 'POST',
        body: JSON.stringify(placeData),
      }),

    update: (id, placeData) =>
      request(`/saved-places/${id}`, {
        method: 'PUT',
        body: JSON.stringify(placeData),
      }),

    delete: (id) =>
      request(`/saved-places/${id}`, {
        method: 'DELETE',
      }),
  },

  // Trusted ICE Contacts
  trustedContacts: {
    getAll: () => request('/trusted-contacts', { method: 'GET' }),

    create: (contactData) =>
      request('/trusted-contacts', {
        method: 'POST',
        body: JSON.stringify(contactData),
      }),

    update: (id, contactData) =>
      request(`/trusted-contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contactData),
      }),

    delete: (id) =>
      request(`/trusted-contacts/${id}`, {
        method: 'DELETE',
      }),
  },
};

export default api;

