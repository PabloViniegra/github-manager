import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import getFiles from "../tools/github_get_pull_request_files.js";

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

function mockPages(pages: unknown[][]): void {
  let i = 0;
  globalThis.fetch = vi.fn().mockImplementation(async () => {
    const body = pages[i++] ?? [];
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

describe("github_get_pull_request_files", () => {
  it("hits the /pulls/{n}/files endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("[]", { status: 200, headers: { "content-type": "application/json" } }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await getFiles.execute(
      { owner: "o", repo: "r", pull_number: 12 },
      {} as never,
    );

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "https://api.github.com/repos/o/r/pulls/12/files?per_page=50&page=1",
    );
  });

  it("projects each file to the slim shape with patch and stats", async () => {
    mockPages([
      [
        {
          sha: "abc123",
          filename: "src/index.ts",
          status: "modified",
          additions: 3,
          deletions: 1,
          changes: 4,
          patch: "@@ -1,1 +1,3 @@\n-old\n+new\n+more",
          previous_filename: "src/old.ts",
          blob_url: "https://github.com/o/r/blob/abc/src/index.ts",
        },
      ],
    ]);

    const out = await getFiles.execute(
      { owner: "o", repo: "r", pull_number: 1 },
      {} as never,
    );
    expect(out).toEqual([
      {
        sha: "abc123",
        filename: "src/index.ts",
        status: "modified",
        additions: 3,
        deletions: 1,
        changes: 4,
        patch: "@@ -1,1 +1,3 @@\n-old\n+new\n+more",
        previous_filename: "src/old.ts",
        blob_url: "https://github.com/o/r/blob/abc/src/index.ts",
      },
    ]);
  });

  it("concatenates pages via getAll", async () => {
    const file = (i: number) => ({
      sha: `s${i}`,
      filename: `f${i}.ts`,
      status: "added",
      additions: 1,
      deletions: 0,
      changes: 1,
      patch: "+x",
    });
    mockPages([
      Array.from({ length: 50 }, (_, i) => file(i)),
      [file(50)],
    ]);

    const out = await getFiles.execute(
      { owner: "o", repo: "r", pull_number: 1 },
      {} as never,
    );
    expect(out).toHaveLength(51);
    expect(out[0]?.filename).toBe("f0.ts");
    expect(out[50]?.filename).toBe("f50.ts");
  });
});
