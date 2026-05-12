const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string;
};

export class ApiError extends Error {
  constructor(readonly status: number, readonly data: unknown, message: string) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const bodyStr = opts.body ? JSON.stringify(opts.body) : null;
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    ...(bodyStr !== null ? { body: bodyStr } : {}),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json, json.title ?? 'Request failed');
  return (json.data ?? json) as T;
}
