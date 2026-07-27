import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAll } from "../lib/github.js";

export default defineTool({
  description: "List all labels defined on a repository.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
  }),
  async execute({ owner, repo }) {
    const labels = await getAll<Record<string, unknown>>(
      `/repos/${owner}/${repo}/labels`,
    );
    return labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      description: l.description,
      default: l.default,
    }));
  },
});
