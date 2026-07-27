import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAll } from "../lib/github.js";

const PR_STATES = ["open", "closed", "all"] as const;

export default defineTool({
  description:
    "List pull requests for a repository. Returns up to 500 PRs (10 pages of 50).",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    state: z
      .enum(PR_STATES)
      .default("open")
      .describe("PR state filter: open, closed, or all."),
    head: z
      .string()
      .optional()
      .describe("Filter by head branch in 'user:branch' or 'org:branch' form."),
    base: z.string().optional().describe("Filter by base branch."),
  }),
  async execute({ owner, repo, state, head, base }) {
    const params = new URLSearchParams();
    params.set("state", state);
    if (head) params.set("head", head);
    if (base) params.set("base", base);
    const prs = await getAll<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls?${params.toString()}`,
    );
    return prs.map((p) => ({
      number: p.number,
      title: p.title,
      state: p.state,
      draft: p.draft,
      user: (p.user as { login?: unknown } | null)?.login ?? null,
      head: (p.head as { ref?: unknown } | null)?.ref ?? null,
      base: (p.base as { ref?: unknown } | null)?.ref ?? null,
      mergeable: p.mergeable,
      updated_at: p.updated_at,
      html_url: p.html_url,
    }));
  },
});
