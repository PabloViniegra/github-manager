import { defineTool } from "eve/tools";
import { z } from "zod";
import { get } from "../lib/github.js";

export default defineTool({
  description:
    "Search code across repositories the authenticated user has access to. Use qualifiers like 'language:go', 'repo:owner/name', or 'path:src' in the query.",
  inputSchema: z.object({
    q: z
      .string()
      .min(1)
      .describe(
        "Code search query. Supports GitHub code search qualifiers (language, repo, path, extension, etc.).",
      ),
    per_page: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(30)
      .describe("Results per page (max 100)."),
  }),
  async execute({ q, per_page }) {
    const params = new URLSearchParams({ q, per_page: String(per_page) });
    const result = await get<{ total_count: number; items: Record<string, unknown>[] }>(
      `/search/code?${params.toString()}`,
    );
    return {
      total_count: result.total_count,
      items: result.items.map((i) => ({
        name: i.name,
        path: i.path,
        repository: (i.repository as { full_name?: unknown } | null)?.full_name ?? null,
        html_url: i.html_url,
      })),
    };
  },
});
