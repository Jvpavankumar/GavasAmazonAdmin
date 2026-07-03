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

const SERVER_STARTING =
  'API server is starting up. Wait a moment, then try login again.';
const SERVER_UNREACHABLE =
  'Cannot reach the API server. On Render free tier it may be waking up — wait 30–60 seconds and try again.';

async function wakeApiServer() {
  try {
    await fetch(`${API_URL}/health`, { method: 'GET' });
  } catch {
    // ignore — retry will surface a clearer error
  }
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

async function request<T>(path: string, options: RequestInit, retryOnColdStart: boolean): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    if (retryOnColdStart) {
      await wakeApiServer();
      return request(path, options, false);
    }
    throw new ApiError(SERVER_UNREACHABLE, 0);
  }

  if ((response.status === 502 || response.status === 503) && retryOnColdStart) {
    await wakeApiServer();
    return request(path, options, false);
  }

  if (response.status === 502 || response.status === 503) {
    throw new ApiError(SERVER_STARTING, response.status);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(payload.error ?? 'Request failed', response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

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

    return request<T>(path, { ...options, headers }, true);
  } finally {
    stopApiLoading();
  }
}
