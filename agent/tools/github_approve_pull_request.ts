import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { post } from "../lib/github.js";

export default defineTool({
  description:
    "Approve a pull request with an optional review body. If commit_id is omitted, GitHub uses the latest commit. Requires human approval.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    pull_number: z.number().int().positive().describe("Pull request number."),
    body: z.string().min(1).optional().describe("Optional review message."),
    commit_id: z
      .string()
      .min(1)
      .optional()
      .describe("Commit SHA to approve; defaults to the latest commit."),
  }),
  approval: always(),
  async execute({ owner, repo, pull_number, ...payload }) {
    return post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls/${pull_number}/reviews`,
      { event: "APPROVE", ...payload },
    );
  },
});
