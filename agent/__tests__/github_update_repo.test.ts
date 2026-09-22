import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import updateRepo from "../tools/github_update_repo.js";

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

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("github_update_repo", () => {
  it("updates the description and replaces repository topics", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ full_name: "o/r", description: "Updated" }))
      .mockResolvedValueOnce(jsonResponse({ names: ["backend", "api"] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await updateRepo.execute(
      {
        owner: "o",
        repo: "r",
        description: "Updated",
        topics: ["backend", "api"],
      },
      {} as never,
    );

    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.github.com/repos/o/r");
    expect(fetchMock.mock.calls[0]![1].method).toBe("PATCH");
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({
      description: "Updated",
    });
    expect(fetchMock.mock.calls[1]![0]).toBe(
      "https://api.github.com/repos/o/r/topics",
    );
    expect(fetchMock.mock.calls[1]![1].method).toBe("PUT");
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body as string)).toEqual({
      names: ["backend", "api"],
    });
    expect(result).toEqual({
      repository: { full_name: "o/r", description: "Updated" },
      topics: ["backend", "api"],
    });
  });

  it("allows clearing all repository topics", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ names: [] }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await updateRepo.execute(
      { owner: "o", repo: "r", topics: [] },
      {} as never,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({
      names: [],
    });
    expect(result).toEqual({ topics: [] });
  });
});
