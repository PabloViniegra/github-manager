import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAll } from "../lib/github.js";

export default defineTool({
  description:
    "List the files changed in a pull request, including each file's patch. Use this before posting inline review comments to know the diff positions.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    pull_number: z.number().int().positive().describe("Pull request number."),
  }),
  async execute({ owner, repo, pull_number }) {
    const files = await getAll<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls/${pull_number}/files`,
    );
    return files.map((f) => ({
      sha: f.sha,
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch,
      previous_filename: f.previous_filename,
      blob_url: f.blob_url,
    }));
  },
});
