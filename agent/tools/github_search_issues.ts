import { defineTool } from "eve/tools";
import { z } from "zod";
import { get } from "../lib/github.js";

const SORTS = ["comments", "reactions", "reactions-+1", "created", "updated"] as const;

export default defineTool({
  description:
    "Search issues and pull requests across GitHub. Use 'is:issue' or 'is:pr' to scope, plus qualifiers like 'repo:owner/name', 'author:user', 'label:bug', or 'state:open'.",
  inputSchema: z.object({
    q: z
      .string()
      .min(1)
      .describe(
        "Search query. Supports GitHub issue search qualifiers (is, repo, author, label, state, mentions, etc.).",
      ),
    sort: z.enum(SORTS).optional().describe("Field to sort by."),
    order: z.enum(["asc", "desc"]).optional().describe("Sort direction."),
    per_page: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(30)
      .describe("Results per page (max 100)."),
  }),
  async execute({ q, sort, order, per_page }) {
    const params = new URLSearchParams({ q, per_page: String(per_page) });
    if (sort) params.set("sort", sort);
    if (order) params.set("order", order);
    const result = await get<{ total_count: number; items: Record<string, unknown>[] }>(
      `/search/issues?${params.toString()}`,
    );
    return {
      total_count: result.total_count,
      items: result.items.map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state,
        is_pr: i.pull_request !== undefined,
        user: (i.user as { login?: unknown } | null)?.login ?? null,
        repository: (i.repository_url as string | undefined)?.split("/").slice(-2).join("/") ?? null,
        comments: i.comments,
        updated_at: i.updated_at,
        html_url: i.html_url,
      })),
    };
  },
});
