const BASE_URL = "https://api.github.com";
const API_VERSION = "2022-11-28";
const MAX_PAGES = 10;
const PER_PAGE = 50;

type RequestInitWithJson = Omit<RequestInit, "body"> & { body?: unknown };

export class GitHubError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
    message: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

export function requireToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not set. Add it to .env.local or your shell before running the agent.",
    );
  }
  return token;
}

async function request<T>(
  method: string,
  path: string,
  init: RequestInitWithJson = {},
): Promise<T> {
  const token = requireToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  const body =
    init.body === undefined
      ? undefined
      : typeof init.body === "string"
        ? init.body
        : JSON.stringify(init.body);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method,
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GitHubError(
      res.status,
      text,
      `GitHub ${method} ${path} failed with ${res.status}: ${text || res.statusText}`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, { body });
}

export function patch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, { body });
}

export function put<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, { body });
}

export function del<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

export async function getAll<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const pagePath = `${path}${sep}per_page=${PER_PAGE}&page=${page}`;
    const batch = await get<T[]>(pagePath);
    out.push(...batch);
    if (batch.length < PER_PAGE) break;
  }
  return out;
}
