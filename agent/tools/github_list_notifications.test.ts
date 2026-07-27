import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import listNotifications from "./github_list_notifications.js";

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

function mockPage(items: unknown[]): void {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(items), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;
}

describe("github_list_notifications", () => {
  it("projects subject fields and repository full_name", async () => {
    mockPage([
      {
        id: "1",
        unread: true,
        reason: "mention",
        updated_at: "2026-03-01",
        subject: {
          title: "PR title",
          type: "PullRequest",
          url: "https://api/subjects/1",
          latest_comment_url: "https://api/comments/1",
        },
        repository: { full_name: "owner/repo" },
      },
    ]);

    const out = await listNotifications.execute(
      { filter: "default", mark_all_read: false },
      {} as never,
    );
    expect(out).toEqual([
      {
        id: "1",
        unread: true,
        reason: "mention",
        updated_at: "2026-03-01",
        subject: {
          title: "PR title",
          type: "PullRequest",
          url: "https://api/subjects/1",
          latest_comment_url: "https://api/comments/1",
        },
        repository: "owner/repo",
      },
    ]);
  });

  it("returns undefined for missing user/repository fields", async () => {
    mockPage([
      {
        id: "2",
        unread: false,
        reason: "subscribed",
        updated_at: "2026-03-02",
        subject: { title: "t", type: "Issue" },
        repository: null,
      },
    ]);

    const out = await listNotifications.execute(
      { filter: "default", mark_all_read: false },
      {} as never,
    );
    expect(out[0]?.repository).toBeUndefined();
  });
});
