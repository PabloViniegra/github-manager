import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { patch } from "../lib/github.js";

const updateable = z
  .object({
    title: z.string().min(1).optional(),
    body: z.string().optional(),
    state: z.enum(["open", "closed"]).optional(),
    base: z.string().min(1).optional(),
    draft: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.body !== undefined ||
      v.state !== undefined ||
      v.base !== undefined ||
      v.draft !== undefined,
    { message: "At least one field to update is required." },
  );

export default defineTool({
  description:
    "Update an existing pull request's title, body, state, base branch, or draft flag. Requires human approval because it modifies a public-facing artifact.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    pull_number: z.number().int().positive().describe("Pull request number."),
    ...updateable.shape,
  }),
  approval: always(),
  async execute({ owner, repo, pull_number, ...payload }) {
    return patch<Record<string, unknown>>(
      `/repos/${owner}/${repo}/pulls/${pull_number}`,
      payload,
    );
  },
});
