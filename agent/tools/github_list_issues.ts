import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAll } from "../lib/github.js";

const ISSUE_STATES = ["open", "closed", "all"] as const;

export default defineTool({
  description:
    "List issues for a repository. By default excludes pull requests; pass include_prs=true to keep them.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    state: z.enum(ISSUE_STATES).default("open").describe("Issue state filter."),
    labels: z
      .string()
      .optional()
      .describe("Comma-separated label names to filter by."),
    include_prs: z
      .boolean()
      .default(false)
      .describe("If true, include pull requests in the result."),
  }),
  async execute({ owner, repo, state, labels, include_prs }) {
    const params = new URLSearchParams();
    params.set("state", state);
    if (labels) params.set("labels", labels);
    const items = await getAll<Record<string, unknown>>(
      `/repos/${owner}/${repo}/issues?${params.toString()}`,
    );
    const filtered = include_prs
      ? items
      : items.filter((i) => i.pull_request === undefined);
    return filtered.map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      user: (i.user as { login?: unknown } | null)?.login ?? null,
      labels: Array.isArray(i.labels)
        ? i.labels.map((l) =>
            typeof l === "object" && l !== null && "name" in l
              ? (l as { name: string }).name
              : l,
          )
        : [],
      comments: i.comments,
      updated_at: i.updated_at,
      html_url: i.html_url,
    }));
  },
});
