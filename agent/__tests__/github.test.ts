import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GitHubError,
  del,
  get,
  getAll,
  patch,
  post,
  put,
  requireToken,
} from "../lib/github.js";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;

beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_TOKEN === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
});

function mockFetch(status: number, body: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockImplementation(async () => {
    if (status === 204) return new Response(null, { status });
    const text = typeof body === "string" ? body : JSON.stringify(body);
    return new Response(text, {
      status,
      headers: { "content-type": "application/json" },
    });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("requireToken", () => {
  it("throws when GITHUB_TOKEN is not set", () => {
    delete process.env.GITHUB_TOKEN;
    expect(() => requireToken()).toThrow("GITHUB_TOKEN is not set");
  });

  it("returns the token when set", () => {
    process.env.GITHUB_TOKEN = "abc";
    expect(requireToken()).toBe("abc");
  });
});

describe("get", () => {
  it("sends GET with Bearer auth and the pinned API version", async () => {
    const mock = mockFetch(200, { ok: true });
    await get("/user");

    expect(mock).toHaveBeenCalledOnce();
    const [url, init] = mock.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/user");
    expect(init.method).toBe("GET");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-token");
    expect(headers["Accept"]).toBe("application/vnd.github+json");
    expect(headers["X-GitHub-Api-Version"]).toBe("2022-11-28");
  });

  it("returns parsed JSON on 2xx", async () => {
    mockFetch(200, { login: "pablo" });
    const out = await get<{ login: string }>("/user");
    expect(out).toEqual({ login: "pablo" });
  });

  it("returns undefined on 204 No Content", async () => {
    mockFetch(204, "");
    const out = await get("/nothing");
    expect(out).toBeUndefined();
  });

  it("throws GitHubError on non-ok and embeds the body in the message", async () => {
    mockFetch(401, JSON.stringify({ message: "Bad credentials" }));

    await expect(get("/user")).rejects.toSatisfy((err: unknown) => {
      return (
        err instanceof GitHubError &&
        err.status === 401 &&
        err.body.includes("Bad credentials")
      );
    });
  });
});

describe("post / patch / put / del", () => {
  it("JSON-stringifies an object body on POST", async () => {
    const mock = mockFetch(201, { id: 1 });
    await post("/user/repos", { name: "x" });

    const [, init] = mock.mock.calls[0]!;
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"name":"x"}');
  });

  it("passes a string body through unchanged", async () => {
    const mock = mockFetch(201, { id: 1 });
    await post("/user/repos", "raw");

    const [, init] = mock.mock.calls[0]!;
    expect(init.body).toBe("raw");
  });

  it("uses PATCH for partial updates", async () => {
    const mock = mockFetch(200, { ok: true });
    await patch("/repos/o/r", { description: "x" });
    const [, init] = mock.mock.calls[0]!;
    expect(init.method).toBe("PATCH");
  });

  it("uses PUT for merge", async () => {
    const mock = mockFetch(200, { merged: true });
    await put("/repos/o/r/pulls/1/merge", { merge_method: "squash" });
    const [, init] = mock.mock.calls[0]!;
    expect(init.method).toBe("PUT");
  });

  it("uses DELETE and returns undefined on 204", async () => {
    const mock = mockFetch(204, "");
    const out = await del("/repos/o/r");

    const [, init] = mock.mock.calls[0]!;
    expect(init.method).toBe("DELETE");
    expect(out).toBeUndefined();
  });
});

describe("getAll", () => {
  it("appends per_page=50 and page=N to the URL", async () => {
    const mock = mockFetch(200, []);
    await getAll("/x");

    const [url] = mock.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/x?per_page=50&page=1");
  });

  it("concatenates pages until a short page is returned", async () => {
    const fullPage = Array.from({ length: 50 }, (_, i) => ({ i }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(fullPage), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(fullPage.map((p) => ({ i: p.i + 50 }))), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ i: 100 }]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const out = await getAll<{ i: number }>("/x");
    expect(out).toHaveLength(101);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(out[0]?.i).toBe(0);
    expect(out[100]?.i).toBe(100);
  });

  it("stops at 10 pages even when every page is full (500-item cap)", async () => {
    const fullPage = Array.from({ length: 50 }, (_, i) => ({ i }));
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(JSON.stringify(fullPage), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const out = await getAll("/x");
    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(out).toHaveLength(500);
  });
});
