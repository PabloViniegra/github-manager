import { defineTool } from "eve/tools";
import { z } from "zod";
import { get } from "../lib/github.js";

export default defineTool({
  description:
    "Fetch a single issue (or pull request) by number, including body, labels, assignees, and comments endpoint URL.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    issue_number: z.number().int().positive().describe("Issue number."),
  }),
  async execute({ owner, repo, issue_number }) {
    return get<Record<string, unknown>>(
      `/repos/${owner}/${repo}/issues/${issue_number}`,
    );
  },
});
