export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.lavieai.net";

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}
