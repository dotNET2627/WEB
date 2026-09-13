import { env } from "@/lib/env";
import type { ApiError } from "@/types/api";

export class ApiClientError extends Error {
  constructor(public readonly status: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = "ApiClientError";
  }
}

export class ApiClient {
  async get<T>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  async post<TResponse, TBody>(path: string, body: TBody, init?: RequestInit): Promise<TResponse> {
    return this.request<TResponse>(path, {
      ...init,
      method: "POST",
      body: JSON.stringify(body)
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers
      },
      cache: "no-store"
    });

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
