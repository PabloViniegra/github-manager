import { defineTool } from "eve/tools";
import { z } from "zod";
import { get } from "../lib/github.js";

export default defineTool({
  description:
    "Fetch a single pull request by number, including body, head/base refs, mergeable state, and merge commit SHA.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    pull_number: z.number().int().positive().describe("Pull request number."),
  }),
  async execute({ owner, repo, pull_number }) {
    return get<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls/${pull_number}`,
    );
  },
});
