import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Safe wrapper around Expo SecureStore.
 * Falls back to in-memory mock or localStorage if running in web preview.
 */
class SecureStorageService {
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, stringValue);
        }
        return;
      }
      await SecureStore.setItemAsync(key, stringValue);
    } catch (error) {
      console.warn(`[SecureStorage] Error saving key "${key}":`, error);
      throw error;
    }
  }

  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`[SecureStorage] Error retrieving key "${key}":`, error);
      return null;
    }
  }

  async getParsedItem(key) {
    const raw = await this.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`[SecureStorage] Error deleting key "${key}":`, error);
    }
  }

  async clearAll(keys = []) {
    for (const key of keys) {
      await this.removeItem(key);
    }
  }
}

export const secureStorage = new SecureStorageService();
export default secureStorage;

