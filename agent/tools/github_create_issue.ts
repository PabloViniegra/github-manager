import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { post } from "../lib/github.js";

export default defineTool({
  description:
    "Create a new issue on a repository. Requires human approval because it posts persistent, public-facing content.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    title: z.string().min(1).describe("Issue title."),
    body: z.string().optional().describe("Issue body in GitHub-flavored Markdown."),
    labels: z
      .array(z.string())
      .optional()
      .describe("Label names to apply (must already exist on the repo)."),
    assignees: z
      .array(z.string())
      .optional()
      .describe("GitHub usernames to assign."),
  }),
  approval: always(),
  async execute({ owner, repo, ...payload }) {
    return post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/issues`,
      payload,
    );
  },
});
