import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import listIssues from "../tools/github_list_issues.js";

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

describe("github_list_issues", () => {
  it("filters out pull requests by default", async () => {
    mockPage([
      {
        number: 1,
        title: "A PR is here too",
        state: "open",
        user: { login: "alice" },
        labels: [{ name: "bug" }],
        comments: 3,
        updated_at: "2026-01-01",
        html_url: "https://x/1",
        pull_request: { url: "https://api/pulls/1" },
      },
      {
        number: 2,
        title: "Real issue",
        state: "open",
        user: { login: "bob" },
        labels: [],
        comments: 0,
        updated_at: "2026-01-02",
        html_url: "https://x/2",
      },
    ]);

    const out = await listIssues.execute(
      { owner: "o", repo: "r", state: "open", include_prs: false },
      {} as never,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ number: 2, title: "Real issue" });
  });

  it("includes pull requests when include_prs=true", async () => {
    mockPage([
      {
        number: 1,
        title: "PR",
        state: "open",
        user: { login: "alice" },
        labels: [],
        comments: 0,
        updated_at: "2026-01-01",
        html_url: "https://x/1",
        pull_request: { url: "https://api/pulls/1" },
      },
      {
        number: 2,
        title: "Real issue",
        state: "open",
        user: { login: "bob" },
        labels: [],
        comments: 0,
        updated_at: "2026-01-02",
        html_url: "https://x/2",
      },
    ]);

    const out = await listIssues.execute(
      {
        owner: "o",
        repo: "r",
        state: "open",
        include_prs: true,
      },
      {} as never,
    );
    expect(out).toHaveLength(2);
  });

  it("projects to the slim issue shape with label names", async () => {
    mockPage([
      {
        number: 7,
        title: "T",
        state: "open",
        user: { login: "u" },
        labels: [{ name: "l1" }, { name: "l2" }],
        comments: 9,
        updated_at: "2026-02-02",
        html_url: "https://x/7",
      },
    ]);

    const out = await listIssues.execute(
      { owner: "o", repo: "r", state: "open", include_prs: false },
      {} as never,
    );
    expect(out[0]).toEqual({
      number: 7,
      title: "T",
      state: "open",
      user: "u",
      labels: ["l1", "l2"],
      comments: 9,
      updated_at: "2026-02-02",
      html_url: "https://x/7",
    });
  });
});
