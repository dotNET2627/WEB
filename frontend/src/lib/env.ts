const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5260";

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, "")
} as const;
