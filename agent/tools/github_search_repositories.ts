import { defineTool } from "eve/tools";
import { z } from "zod";
import { get } from "../lib/github.js";

const SORTS = ["stars", "forks", "help-wanted-issues", "updated"] as const;

export default defineTool({
  description:
    "Search public repositories. Use qualifiers like 'language:typescript', 'stars:>100', or 'user:owner' in the query.",
  inputSchema: z.object({
    q: z
      .string()
      .min(1)
      .describe(
        "Search query. Supports GitHub repository search qualifiers (language, stars, user, topic, etc.).",
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
      `/search/repositories?${params.toString()}`,
    );
    return {
      total_count: result.total_count,
      items: result.items.map((r) => ({
        full_name: r.full_name,
        description: r.description,
        visibility: r.private ? "private" : "public",
        language: r.language,
        stargazers_count: r.stargazers_count,
        updated_at: r.updated_at,
        html_url: r.html_url,
      })),
    };
  },
});
