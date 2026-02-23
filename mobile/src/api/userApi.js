// userApi.js
const API_BASE_URL = 'http://192.168.29.204:5248/api';

export const userApi = {
  getUserById: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user');
      }
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },
  getUserByMobile: async (mobileNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/mobile/${mobileNumber}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user');
      }
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },
};
