import { z } from "zod";

export const repositoryInput = {
  owner: z.string().min(1),
  repo: z.string().min(1),
};

export const paginationInput = {
  page: z.number().int().positive().default(1),
  per_page: z.number().int().min(1).max(100).default(30),
};

export const runInput = {
  ...repositoryInput,
  run_id: z.number().int().positive(),
};

export function repositoryPath(owner: string, repo: string): string {
  return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

export function projectRun(run: Record<string, unknown>) {
  return {
    id: run.id,
    name: run.name,
    workflow_id: run.workflow_id,
    check_suite_id: run.check_suite_id,
    head_branch: run.head_branch,
    head_sha: run.head_sha,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    run_attempt: run.run_attempt,
    created_at: run.created_at,
    updated_at: run.updated_at,
    html_url: run.html_url,
  };
}
