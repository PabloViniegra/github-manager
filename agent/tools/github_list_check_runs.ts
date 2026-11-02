import { defineTool } from "eve/tools";
import { z } from "zod";
import { paginationInput, repositoryInput, repositoryPath } from "../lib/actions.js";
import { get } from "../lib/github.js";

export default defineTool({
  description: "List latest checks in a workflow run's check suite, including checks that failed before any jobs started. Read their annotations to diagnose billing failures.",
  inputSchema: z.object({
    ...repositoryInput,
    ...paginationInput,
    check_suite_id: z.number().int().positive(),
  }),
  async execute({ owner, repo, check_suite_id, page, per_page }) {
    const result = await get<{ total_count: number; check_runs: Record<string, unknown>[] }>(
      `${repositoryPath(owner, repo)}/check-suites/${check_suite_id}/check-runs?filter=latest&page=${page}&per_page=${per_page}`,
    );
    return {
      total_count: result.total_count,
      check_runs: result.check_runs.map((check) => {
        const output = check.output as Record<string, unknown> | null;
        return {
          id: check.id,
          name: check.name,
          status: check.status,
          conclusion: check.conclusion,
          html_url: check.html_url,
          title: output?.title,
          summary: typeof output?.summary === "string" ? output.summary.slice(0, 4000) : null,
          annotations_count: output?.annotations_count,
        };
      }),
      next_page: result.check_runs.length === per_page ? page + 1 : null,
    };
  },
});
