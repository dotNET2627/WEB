import { env } from "@/lib/env";
import type { ApiError } from "@/types/api";

let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onSessionExpiredCallback: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setOnSessionExpired(callback: () => void): void {
  onSessionExpiredCallback = callback;
}

export async function executeRefreshToken(): Promise<string | null> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/auth/refresh-token`, {
      method: "POST",
      credentials: "include", // Sends HttpOnly refreshToken cookie (Path=/api/v1/auth)
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      setAccessToken(null);
      return null;
    }

    const data = await response.json();
    if (data?.accessToken) {
      setAccessToken(data.accessToken);
      return data.accessToken;
    }

    setAccessToken(null);
    return null;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class ApiClient {
  async get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  async post<TResponse, TBody>(path: string, body?: TBody, init?: RequestInit): Promise<TResponse> {
    return this.request<TResponse>(path, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  async put<TResponse, TBody>(path: string, body?: TBody, init?: RequestInit): Promise<TResponse> {
    return this.request<TResponse>(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  }

  async delete<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
    return this.request<TResponse>(path, { ...init, method: "DELETE" });
  }

  private async request<T>(path: string, init: RequestInit, isRetry = false): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");

    if (init.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (inMemoryAccessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
    }

    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers,
      cache: "no-store"
    });

    // Handle 401 Unauthorized with Single-Flight Mutex Promise
    const isAuthRoute = path.startsWith("/api/v1/auth/login") || path.startsWith("/api/v1/auth/refresh-token");
    if (response.status === 401 && !isRetry && !isAuthRoute) {
      if (!refreshPromise) {
        refreshPromise = executeRefreshToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        // Retry initial request with new access token
        return this.request<T>(path, init, true);
      } else {
        onSessionExpiredCallback?.();
      }
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as ApiError | null;
      throw new ApiClientError(response.status, error?.detail ?? "API request failed.", error);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient();
