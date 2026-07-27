import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { post } from "../lib/github.js";

export default defineTool({
  description:
    "Add a comment to an existing issue or pull request. Requires human approval because it posts visible content on the user's behalf.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    issue_number: z
      .number()
      .int()
      .positive()
      .describe("Issue or pull request number to comment on."),
    body: z.string().min(1).describe("Comment body in GitHub-flavored Markdown."),
  }),
  approval: always(),
  async execute({ owner, repo, issue_number, body }) {
    return post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/issues/${issue_number}/comments`,
      { body },
    );
  },
});
