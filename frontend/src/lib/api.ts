const TOKEN_KEY = 'hudud_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const res = await fetch(`/api${path}`, { ...init, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;
    throw new ApiError(res.status, msg || `Xatolik (${res.status})`);
  }
  return data as T;
}

const post = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export interface Territory {
  id: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  radiusM: number;
}
export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: 'ADMIN' | 'EMPLOYEE';
  org: { id: string; name: string };
  territories?: Territory[];
}
export interface AttendanceItem {
  id: string;
  checkInAt: string;
  distanceM: number;
  withinZone: boolean;
  photoUrl?: string | null;
  territory: { id: string; name: string };
  user?: { id: string; fullName: string; phone: string };
}
export interface AttendanceResult {
  id: string;
  checkInAt: string;
  distanceM: number;
  withinZone: boolean;
  territory: { id: string; name: string; radiusM: number };
  message: string;
}

export const api = {
  login: (phone: string, password: string) =>
    post<{ accessToken: string; user: User }>('/auth/login', { phone, password }),
  me: () => request<User>('/auth/me'),
  territories: () => request<Territory[]>('/territories'),
  setAttendance: (b: {
    territoryId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    photoUrl?: string;
  }) => post<AttendanceResult>('/attendance/set', b),
  myAttendance: () => request<AttendanceItem[]>('/attendance/my'),
  orgAttendance: () => request<AttendanceItem[]>('/attendance/org'),
  upload: (file: Blob, name = 'photo.jpg') => {
    const fd = new FormData();
    fd.append('file', file, name);
    return request<{ url: string }>('/files/upload', { method: 'POST', body: fd });
  },
};
