import { defineTool } from "eve/tools";
import { z } from "zod";
import { paginationInput, projectRun, repositoryInput, repositoryPath } from "../lib/actions.js";
import { get } from "../lib/github.js";

export default defineTool({
  description:
    "List Actions workflow runs in one repository, including failures. Paginate all results; use created to bound the investigation. A failure alone does not establish a billing problem.",
  inputSchema: z.object({
    ...repositoryInput,
    ...paginationInput,
    status: z.enum(["completed", "queued", "in_progress", "failure", "success", "cancelled", "timed_out", "action_required", "startup_failure", "stale", "waiting", "requested", "pending", "neutral", "skipped"]).optional(),
    branch: z.string().min(1).optional(),
    created: z.string().min(1).optional().describe("GitHub date filter, e.g. >=2026-10-01 or 2026-10-01..2026-11-02."),
  }),
  async execute({ owner, repo, page, per_page, status, branch, created }) {
    const params = new URLSearchParams({ page: String(page), per_page: String(per_page) });
    if (status) params.set("status", status);
    if (branch) params.set("branch", branch);
    if (created) params.set("created", created);
    const result = await get<{ total_count: number; workflow_runs: Record<string, unknown>[] }>(
      `${repositoryPath(owner, repo)}/actions/runs?${params}`,
    );
    return {
      total_count: result.total_count,
      workflow_runs: result.workflow_runs.map(projectRun),
      next_page: result.workflow_runs.length === per_page ? page + 1 : null,
      search_limit: 1000,
    };
  },
});
