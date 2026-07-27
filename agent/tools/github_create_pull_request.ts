import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { post } from "../lib/github.js";

export default defineTool({
  description:
    "Open a new pull request. Requires human approval because it creates persistent, public-facing state and can trigger CI.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    title: z.string().min(1).describe("Pull request title."),
    head: z
      .string()
      .min(1)
      .describe("Branch containing the changes. 'branch' or 'user:branch' for cross-fork PRs."),
    base: z.string().min(1).describe("Branch to merge into."),
    body: z.string().optional().describe("Pull request description in GitHub-flavored Markdown."),
    draft: z
      .boolean()
      .default(false)
      .describe("If true, create as a draft pull request."),
  }),
  approval: always(),
  async execute({ owner, repo, ...payload }) {
    return post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls`,
      payload,
    );
  },
});
