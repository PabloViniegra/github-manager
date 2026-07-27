import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { del } from "../lib/github.js";

export default defineTool({
  description:
    "Permanently delete a repository owned by the authenticated user. This action is IRREVERSIBLE: it removes the repo, all its issues, PRs, releases, wikis, and forks inside the owner's account. Requires human approval.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner (must be the authenticated user for this token)."),
    repo: z.string().min(1).describe("Repository name to delete."),
  }),
  approval: always(),
  async execute({ owner, repo }) {
    await del(`/repos/${owner}/${repo}`);
    return { deleted: true, full_name: `${owner}/${repo}` };
  },
});
