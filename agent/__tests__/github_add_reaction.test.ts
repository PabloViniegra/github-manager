import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import addReaction from "../tools/github_add_reaction.js";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;

beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-27T12:00:00Z"));
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.useRealTimers();
  if (ORIGINAL_TOKEN === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
});

function mockFetch(): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ id: 1, content: "+1" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe("github_add_reaction", () => {
  it("routes issue subject to /issues/{id}/reactions", async () => {
    const fetchMock = mockFetch();
    await addReaction.execute(
      {
        owner: "o",
        repo: "r",
        subject_type: "issue",
        subject_id: 42,
        content: "+1",
      },
      {} as never,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/repos/o/r/issues/42/reactions",
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      content: "+1",
    });
  });

  it("routes issue_comment subject to /issues/comments/{id}/reactions", async () => {
    const fetchMock = mockFetch();
    await addReaction.execute(
      {
        owner: "o",
        repo: "r",
        subject_type: "issue_comment",
        subject_id: 99,
        content: "heart",
      },
      {} as never,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/repos/o/r/issues/comments/99/reactions",
    );
  });

  it("routes pr_review_comment subject to /pulls/comments/{id}/reactions", async () => {
    const fetchMock = mockFetch();
    await addReaction.execute(
      {
        owner: "o",
        repo: "r",
        subject_type: "pr_review_comment",
        subject_id: 7,
        content: "rocket",
      },
      {} as never,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.github.com/repos/o/r/pulls/comments/7/reactions",
    );
  });
});
