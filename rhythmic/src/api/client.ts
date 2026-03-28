export type ApiError = {
  error: string;
  details?: unknown;
};

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    credentials: "include",
  });

  const body = await readJson(res);
  if (!res.ok) {
    const err: ApiError = typeof body === "object" && body && "error" in body ? body : { error: "request_failed" };
    throw Object.assign(new Error(err.error), { status: res.status, body: err });
  }
  return body as T;
}

