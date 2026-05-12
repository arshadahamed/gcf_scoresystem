const API_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env['API_URL'] ?? 'http://localhost:3001';

export async function apiFetch<T>(path: string, options?: RequestInit & { tags?: string[] }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    next: options?.tags ? { tags: options.tags } : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  const json = await res.json() as { data: T };
  return json.data;
}
