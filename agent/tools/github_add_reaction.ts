import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { post } from "../lib/github.js";

const SUBJECT_TYPES = ["issue", "issue_comment", "pr_review_comment"] as const;
const REACTIONS = [
  "+1",
  "-1",
  "laugh",
  "confused",
  "heart",
  "hooray",
  "rocket",
  "eyes",
] as const;

const PATHS = {
  issue: (owner: string, repo: string, id: number) =>
    `/repos/${owner}/${repo}/issues/${id}/reactions`,
  issue_comment: (owner: string, repo: string, id: number) =>
    `/repos/${owner}/${repo}/issues/comments/${id}/reactions`,
  pr_review_comment: (owner: string, repo: string, id: number) =>
    `/repos/${owner}/${repo}/pulls/comments/${id}/reactions`,
} as const;

export default defineTool({
  description:
    "Add a reaction emoji to an issue, a pull request, an issue comment, or a pull request review comment. Requires human approval because it is a public write on the user's behalf.",
  inputSchema: z.object({
    owner: z.string().min(1).describe("Repository owner."),
    repo: z.string().min(1).describe("Repository name."),
    subject_type: z
      .enum(SUBJECT_TYPES)
      .describe(
        "What is being reacted to: 'issue' covers both issues and pull requests (they share an endpoint), 'issue_comment' is a conversation comment, 'pr_review_comment' is an inline diff comment.",
      ),
    subject_id: z
      .number()
      .int()
      .positive()
      .describe(
        "Identifier for the subject: issue/PR number for 'issue', or comment id for the comment types.",
      ),
    content: z.enum(REACTIONS).describe("Reaction emoji name."),
  }),
  approval: always(),
  async execute({ owner, repo, subject_type, subject_id, content }) {
    const path = PATHS[subject_type](owner, repo, subject_id);
    return post<Record<string, unknown>>(path, { content });
  },
});
