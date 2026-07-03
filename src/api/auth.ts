import { api } from './client';
import type { User } from '../types/auth';

interface AuthResponse {
  token: string;
  user: User;
}

export function loginWithGoogle(credential: string) {
  return api<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export function adminLogin(email: string, password: string) {
  return api<AuthResponse>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function fetchCurrentUser() {
  return api<User>('/auth/me');
}

export function updateProfile(data: Partial<Pick<User, 'name' | 'location'>>) {
  return api<User>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
