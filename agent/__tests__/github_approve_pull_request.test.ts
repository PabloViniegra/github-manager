import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import approvePullRequest from "../tools/github_approve_pull_request.js";

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

describe("github_approve_pull_request", () => {
  it("submits an approval review for the selected pull request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 7, state: "APPROVED" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await approvePullRequest.execute(
      {
        owner: "o",
        repo: "r",
        pull_number: 12,
        body: "Looks good.",
        commit_id: "abc123",
      },
      {} as never,
    );

    expect(fetchMock.mock.calls[0]![0]).toBe(
      "https://api.github.com/repos/o/r/pulls/12/reviews",
    );
    expect(fetchMock.mock.calls[0]![1].method).toBe("POST");
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({
      event: "APPROVE",
      body: "Looks good.",
      commit_id: "abc123",
    });
    expect(result).toEqual({ id: 7, state: "APPROVED" });
  });
});
