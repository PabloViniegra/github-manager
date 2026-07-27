import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { patch } from "../lib/github.js";

const ISSUE_STATE = ["open", "closed"] as const;

export default defineTool({
  description:
    "Update an existing issue: change title, body, state (open/closed), labels, or assignees. Requires human approval.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    issue_number: z.number().int().positive().describe("Issue number."),
    title: z.string().optional().describe("New title."),
    body: z.string().optional().describe("New body."),
    state: z.enum(ISSUE_STATE).optional().describe("New state: open or closed."),
    labels: z
      .array(z.string())
      .optional()
      .describe("Replace the label set with this list."),
    assignees: z
      .array(z.string())
      .optional()
      .describe("Replace the assignee set with this list."),
  }),
  approval: always(),
  async execute({ owner, repo, issue_number, ...patch_ }) {
    return patch<Record<string, unknown>>(
      `/repos/${owner}/${repo}/issues/${issue_number}`,
      patch_,
    );
  },
});
