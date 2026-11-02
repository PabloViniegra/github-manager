import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { repositoryPath, runInput } from "../lib/actions.js";
import { post } from "../lib/github.js";

export default defineTool({
  description: "Re-run an existing Actions run (same commit/ref), not a new workflow dispatch. May consume paid quota and repeat deployment side effects. Requires human approval. Default: failed jobs and dependents only; use all for startup failures with no jobs. GitHub decides rerun eligibility.",
  inputSchema: z.object({
    ...runInput,
    mode: z.enum(["failed_jobs", "all"]).default("failed_jobs"),
  }),
  approval: always(),
  async execute({ owner, repo, run_id, mode }) {
    const endpoint = mode === "all" ? "rerun" : "rerun-failed-jobs";
    await post(`${repositoryPath(owner, repo)}/actions/runs/${run_id}/${endpoint}`);
    return { owner, repo, run_id, mode, accepted: true };
  },
});
