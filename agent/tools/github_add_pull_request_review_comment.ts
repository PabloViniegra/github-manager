import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { post } from "../lib/github.js";

export default defineTool({
  description:
    "Post an inline review comment on a pull request diff. Requires the head commit SHA; fetch it with github_get_pull_request. Requires human approval because it posts public content.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    pull_number: z.number().int().positive().describe("Pull request number."),
    body: z.string().min(1).describe("Comment body in GitHub-flavored Markdown."),
    path: z.string().min(1).describe("Relative path of the file to comment on."),
    commit_id: z
      .string()
      .min(1)
      .describe("SHA of the commit to anchor the comment to (usually the PR head SHA)."),
    line: z.number().int().positive().describe("Line number on the diff."),
    side: z.enum(["LEFT", "RIGHT"]).describe("Side of the diff (LEFT = old, RIGHT = new)."),
    start_line: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("First line of a multi-line comment range."),
    start_side: z
      .enum(["LEFT", "RIGHT"])
      .optional()
      .describe("Side of the diff for the start of a multi-line range."),
  }),
  approval: always(),
  async execute(input) {
    const { owner, repo, pull_number, ...payload } = input;
    return post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls/${pull_number}/comments`,
      payload,
    );
  },
});
