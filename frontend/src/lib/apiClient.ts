const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export async function apiGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status} on ${url.pathname}`);
  }
  return (await res.json()) as T;
}

