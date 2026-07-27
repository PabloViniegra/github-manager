import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import markRead from "../tools/github_mark_notification_read.js";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;
const ORIGINAL_NOW = Date.now;

beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-27T12:00:00.000Z"));
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.useRealTimers();
  Date.now = ORIGINAL_NOW;
  if (ORIGINAL_TOKEN === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
});

function mockFetch(): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("github_mark_notification_read", () => {
  it("PATCHes /notifications/threads/{id} with a fresh ISO timestamp", async () => {
    const fetchMock = mockFetch();

    const out = await markRead.execute({ thread_id: "T-42" }, {} as never);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.github.com/notifications/threads/T-42");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({
      last_read_at: "2026-07-27T12:00:00.000Z",
    });
    expect(out).toEqual({ thread_id: "T-42", last_read_at: "now" });
  });

  it("uses the wall clock at call time, not at module load", async () => {
    const fetchMock = mockFetch();

    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    await markRead.execute({ thread_id: "T-1" }, {} as never);

    vi.setSystemTime(new Date("2026-12-31T23:59:59.000Z"));
    await markRead.execute({ thread_id: "T-2" }, {} as never);

    expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({
      last_read_at: "2026-01-01T00:00:00.000Z",
    });
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body as string)).toEqual({
      last_read_at: "2026-12-31T23:59:59.000Z",
    });
  });
});
