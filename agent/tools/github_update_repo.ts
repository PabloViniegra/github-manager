import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { patch, put } from "../lib/github.js";

const updateable = z.object({
  description: z
    .string()
    .optional()
    .describe("New repository description; use an empty string to clear it."),
  topics: z
    .array(z.string().min(1))
    .optional()
    .describe("Replace the repository topic list; use an empty array to clear it."),
});

export default defineTool({
  description:
    "Update a repository description and/or topics. The topic list replaces all existing topics. Requires human approval.",
  inputSchema: z
    .object({
      owner: z.string().min(1).describe("Repository owner."),
      repo: z.string().min(1).describe("Repository name."),
      ...updateable.shape,
    })
    .refine(
      ({ description, topics }) =>
        description !== undefined || topics !== undefined,
      { message: "At least one repository field to update is required." },
    ),
  approval: always(),
  async execute({ owner, repo, description, topics }) {
    const result: Record<string, unknown> = {};

    if (description !== undefined) {
      result.repository = await patch<Record<string, unknown>>(
        `/repos/${owner}/${repo}`,
        { description },
      );
    }

    if (topics !== undefined) {
      const updatedTopics = await put<{ names: string[] }>(
        `/repos/${owner}/${repo}/topics`,
        { names: topics },
      );
      result.topics = updatedTopics.names;
    }

    return result;
  },
});
