const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'gavasamazon-token';
const GUEST_KEY = 'gavasamazon-guest-id';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getGuestId() {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

import { startApiLoading, stopApiLoading } from './loading.js';

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  startApiLoading();
  try {
    const token = getAuthToken();
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    headers.set('X-Guest-Id', getGuestId());

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(payload.error ?? 'Request failed', response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } finally {
    stopApiLoading();
  }
}
