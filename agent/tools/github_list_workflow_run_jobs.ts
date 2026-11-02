import { defineTool } from "eve/tools";
import { z } from "zod";
import { paginationInput, repositoryPath, runInput } from "../lib/actions.js";
import { get } from "../lib/github.js";

export default defineTool({
  description: "List jobs from the latest attempt of an Actions run. check_run_url contains the check ID for reading failure annotations. Billing failures may have no jobs; inspect the run's check suite in that case.",
  inputSchema: z.object({ ...runInput, ...paginationInput }),
  async execute({ owner, repo, run_id, page, per_page }) {
    const result = await get<{ total_count: number; jobs: Record<string, unknown>[] }>(
      `${repositoryPath(owner, repo)}/actions/runs/${run_id}/jobs?filter=latest&page=${page}&per_page=${per_page}`,
    );
    return {
      total_count: result.total_count,
      jobs: result.jobs.map((job) => ({
        id: job.id,
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        started_at: job.started_at,
        completed_at: job.completed_at,
        check_run_url: job.check_run_url,
        html_url: job.html_url,
      })),
      next_page: result.jobs.length === per_page ? page + 1 : null,
    };
  },
});
