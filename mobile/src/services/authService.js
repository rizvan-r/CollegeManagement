import api from './api';
import { secureStorage } from './secureStorage';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { ENDPOINTS } from '../api/endpoints';
import { mapBackendRoleToInternal } from '../constants/roles';

export const authService = {
  /**
   * Authenticates user against backend POST /api/v1/auth/login
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, token: string, user: object, internalRole: string }>}
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const payload = {
      email: email.trim().toLowerCase(),
      password,
    };

    const response = await api.post(ENDPOINTS.AUTH.LOGIN, payload);

    if (response?.success && response?.token && response?.user) {
      const internalRole = mapBackendRoleToInternal(response.user.role);
      const enrichedUser = {
        ...response.user,
        internalRole,
      };

      // Persist to SecureStore
      await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await secureStorage.setItem(STORAGE_KEYS.USER_DATA, enrichedUser);

      return {
        success: true,
        token: response.token,
        user: enrichedUser,
        internalRole,
      };
    }

    throw new Error(response?.message || 'Authentication failed. Please verify credentials.');
  },

  /**
   * Fetches fresh user profile using stored JWT via GET /api/v1/auth/me
   * @returns {Promise<object>}
   */
  async getProfile() {
    const response = await api.get(ENDPOINTS.AUTH.ME);
    if (response?.success && response?.user) {
      const internalRole = mapBackendRoleToInternal(response.user.role);
      const enrichedUser = {
        ...response.user,
        internalRole,
      };

      // Update cached user in SecureStore
      await secureStorage.setItem(STORAGE_KEYS.USER_DATA, enrichedUser);
      return enrichedUser;
    }
    throw new Error(response?.message || 'Failed to retrieve authenticated profile.');
  },

  /**
   * Changes password via POST /api/v1/auth/change-password
   */
  async changePassword(currentPassword, newPassword) {
    return await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },

  /**
   * Clears stored credentials and terminates session
   */
  async logout() {
    try {
      await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch {
      // Safe cleanup error suppression
    }
  },
};

export default authService;

