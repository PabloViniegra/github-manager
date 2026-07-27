import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { post } from "../lib/github.js";

const HEX_COLOR = /^[0-9a-fA-F]{6}$/;

export default defineTool({
  description:
    "Create a new label on a repository. Requires human approval because it changes the project's metadata taxonomy.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    name: z.string().min(1).describe("Label name."),
    color: z
      .string()
      .regex(HEX_COLOR, "Color must be a 6-character hex string without the leading '#'.")
      .describe("Label color as 6-char hex (no leading '#')."),
    description: z.string().optional().describe("Short description of the label's purpose."),
  }),
  approval: always(),
  async execute({ owner, repo, ...payload }) {
    return post<Record<string, unknown>>(
      `/repos/${owner}/${repo}/labels`,
      payload,
    );
  },
});
