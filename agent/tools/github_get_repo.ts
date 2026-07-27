import { defineTool } from "eve/tools";
import { z } from "zod";
import { get } from "../lib/github.js";

export default defineTool({
  description:
    "Fetch a single repository by its 'owner/name' slug. Returns the full repo payload.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner (user or org login)."),
    repo: z.string().min(1).describe("Repository name."),
  }),
  async execute({ owner, repo }) {
    return get<Record<string, unknown>>(`/repos/${owner}/${repo}`);
  },
});
