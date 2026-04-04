import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';
import type { User } from '@solar-monitor/shared';

const TOKEN_KEY = 'auth_token';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        setToken(stored);
        api.setToken(stored);
      }
    } catch {
      // Token not found
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const result = await api.post<{ data: { user: User; token: string } }>('/api/auth/login', {
      email,
      password,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, result.data.token);
    setToken(result.data.token);
    setUser(result.data.user);
    api.setToken(result.data.token);
  }

  async function register(email: string, password: string): Promise<void> {
    const result = await api.post<{ data: { user: User; token: string } }>('/api/auth/register', {
      email,
      password,
    });
    await SecureStore.setItemAsync(TOKEN_KEY, result.data.token);
    setToken(result.data.token);
    setUser(result.data.user);
    api.setToken(result.data.token);
  }

  async function logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    api.setToken(null);
  }

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    register,
    logout,
  };
}
