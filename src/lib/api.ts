import type { ApiError } from "@/lib/schemas";

const STORAGE_KEY = "vmgmt.session";

export type Session = {
  token: string;
  user: { id: string; username: string; role: "admin" | "user" };
};

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export class ApiException extends Error {
  status: number;
  field?: string;
  constructor(status: number, message: string, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
    this.name = "ApiException";
  }
}

type RequestOptions = {
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const session = loadSession();
  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const err = (data ?? {}) as ApiError;
    throw new ApiException(
      res.status,
      err.message ?? `HTTP ${res.status}`,
      err.field,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    request<T>("GET", path, { signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>("POST", path, { body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>("PUT", path, { body, signal }),
  del: <T>(path: string, signal?: AbortSignal) =>
    request<T>("DELETE", path, { signal }),
};
