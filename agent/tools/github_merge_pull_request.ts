import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { put } from "../lib/github.js";

const MERGE_METHODS = ["merge", "squash", "rebase"] as const;

export default defineTool({
  description:
    "Merge a pull request. Requires human approval because it mutates the target branch and is irreversible.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    pull_number: z.number().int().positive().describe("Pull request number."),
    commit_title: z
      .string()
      .optional()
      .describe("Title for the merge commit. GitHub generates one if omitted."),
    commit_message: z
      .string()
      .optional()
      .describe("Extra detail for the merge commit body."),
    merge_method: z
      .enum(MERGE_METHODS)
      .default("merge")
      .describe("How to combine the commits: merge, squash, or rebase."),
  }),
  approval: always(),
  async execute({ owner, repo, pull_number, ...payload }) {
    return put<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls/${pull_number}/merge`,
      payload,
    );
  },
});
