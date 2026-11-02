import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import listRuns from "../tools/github_list_workflow_runs.js";
import getRun from "../tools/github_get_workflow_run.js";
import listJobs from "../tools/github_list_workflow_run_jobs.js";
import listChecks from "../tools/github_list_check_runs.js";
import listAnnotations from "../tools/github_list_check_annotations.js";
import rerun from "../tools/github_rerun_workflow.js";
import usage from "../tools/github_get_actions_usage.js";
import budgets from "../tools/github_get_actions_budgets.js";
import { GitHubError } from "../lib/github.js";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_TOKEN = process.env.GITHUB_TOKEN;
const TARGET = { owner: "o", repo: "r" };
const PAGE = { page: 1, per_page: 30 };
const CONTEXT = {} as never;

beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_TOKEN === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = ORIGINAL_TOKEN;
});

function mockResponse(body: unknown, status = 200) {
  const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  globalThis.fetch = mock as unknown as typeof fetch;
  return mock;
}

describe("Actions investigation", () => {
  it("encodes run filters and returns compact, paginated results", async () => {
    const mock = mockResponse({ total_count: 2, workflow_runs: [{ id: 42, status: "completed", conclusion: "failure", actor: { email: "unneeded" } }] });
    const result = await listRuns.execute({ ...TARGET, page: 2, per_page: 1, status: "failure", branch: "fix/a&b", created: ">=2026-10-01" }, CONTEXT);
    const url = new URL(mock.mock.calls[0]![0] as string);
    expect(url.pathname).toBe("/repos/o/r/actions/runs");
    expect(Object.fromEntries(url.searchParams)).toEqual({ page: "2", per_page: "1", status: "failure", branch: "fix/a&b", created: ">=2026-10-01" });
    expect(result.next_page).toBe(3);
    expect(result.workflow_runs[0]).toMatchObject({ id: 42, conclusion: "failure" });
    expect(result.workflow_runs[0]).not.toHaveProperty("actor");
  });

  it("gets current run state for follow-up verification", async () => {
    const mock = mockResponse({ id: 42, run_attempt: 2, status: "queued", check_suite_id: 7 });
    expect(await getRun.execute({ ...TARGET, run_id: 42 }, CONTEXT)).toMatchObject({ run_attempt: 2, status: "queued", check_suite_id: 7 });
    expect(mock.mock.calls[0]![0]).toBe("https://api.github.com/repos/o/r/actions/runs/42");
  });

  it("lists latest jobs without fetching check URLs or logs", async () => {
    const mock = mockResponse({ total_count: 1, jobs: [{ id: 1, check_run_url: "https://example.invalid/secret", steps: ["unneeded"] }] });
    const result = await listJobs.execute({ ...TARGET, ...PAGE, run_id: 42 }, CONTEXT);
    expect(mock).toHaveBeenCalledOnce();
    expect(mock.mock.calls[0]![0]).toContain("/runs/42/jobs?filter=latest&page=1&per_page=30");
    expect(result.jobs[0]).not.toHaveProperty("steps");
    expect(result.next_page).toBeNull();
  });

  it("supports empty jobs for startup failures", async () => {
    mockResponse({ total_count: 0, jobs: [] });
    expect(await listJobs.execute({ ...TARGET, ...PAGE, run_id: 42 }, CONTEXT)).toEqual({ total_count: 0, jobs: [], next_page: null });
  });

  it("finds check IDs in a suite and bounds summaries", async () => {
    const mock = mockResponse({ total_count: 1, check_runs: [{ id: 8, output: { summary: "a".repeat(5000), annotations_count: 1, text: "unneeded" } }] });
    const result = await listChecks.execute({ ...TARGET, ...PAGE, check_suite_id: 7 }, CONTEXT);
    expect(mock.mock.calls[0]![0]).toContain("/check-suites/7/check-runs?filter=latest");
    expect(result.check_runs[0]?.summary).toHaveLength(4000);
    expect(result.check_runs[0]?.annotations_count).toBe(1);
  });

  it("returns billing annotations without raw details and bounds messages", async () => {
    const mock = mockResponse([{ title: "Billing", message: "x".repeat(5000), raw_details: "unneeded" }]);
    const result = await listAnnotations.execute({ ...TARGET, page: 2, per_page: 1, check_run_id: 8 }, CONTEXT);
    expect(mock.mock.calls[0]![0]).toContain("/check-runs/8/annotations?page=2&per_page=1");
    expect(result.annotations[0]?.message).toHaveLength(4000);
    expect(result.annotations[0]).not.toHaveProperty("raw_details");
    expect(result.next_page).toBe(3);
  });
});

describe("Actions reruns", () => {
  it.each([
    ["failed_jobs", "rerun-failed-jobs"],
    ["all", "rerun"],
  ] as const)("posts %s and reports acceptance, not success", async (mode, endpoint) => {
    const mock = mockResponse(null, 201);
    expect(await rerun.execute({ ...TARGET, run_id: 42, mode }, CONTEXT)).toEqual({ ...TARGET, run_id: 42, mode, accepted: true });
    expect(mock.mock.calls[0]![0]).toBe(`https://api.github.com/repos/o/r/actions/runs/42/${endpoint}`);
    expect(mock.mock.calls[0]![1].method).toBe("POST");
    expect(mock.mock.calls[0]![1].body).toBeUndefined();
  });

  it("surfaces rejected reruns without retrying", async () => {
    const mock = mockResponse({ message: "Run is too old" }, 403);
    await expect(rerun.execute({ ...TARGET, run_id: 42, mode: "all" }, CONTEXT)).rejects.toBeInstanceOf(GitHubError);
    expect(mock).toHaveBeenCalledOnce();
  });
});

describe("Actions billing evidence", () => {
  it.each([["user", "users"], ["organization", "organizations"]] as const)("reads %s usage without claiming available quota", async (account_type, scope) => {
    const items = [{ product: "Actions", grossQuantity: 1000, netAmount: 0 }];
    const mock = mockResponse({ timePeriod: { year: 2026, month: 11 }, usageItems: items, extra: "unneeded" });
    const result = await usage.execute({ account: "o", account_type, year: 2026, month: 11, repository: "o/r" }, CONTEXT);
    const url = new URL(mock.mock.calls[0]![0] as string);
    expect(url.pathname).toBe(`/${scope}/o/settings/billing/usage/summary`);
    expect(Object.fromEntries(url.searchParams)).toEqual({ product: "Actions", year: "2026", month: "11", repository: "o/r" });
    expect(result.quota_available).toBeNull();
    expect(result.usage_items).toEqual(items);
    expect(result).not.toHaveProperty("extra");
  });

  it("leaves period defaults to GitHub and does not interpret zero usage", async () => {
    const mock = mockResponse({ usageItems: [] });
    const result = await usage.execute({ account: "o", account_type: "user" }, CONTEXT);
    expect(mock.mock.calls[0]![0]).toBe("https://api.github.com/users/o/settings/billing/usage/summary?product=Actions");
    expect(result.quota_available).toBeNull();
  });

  it.each([403, 404])("does not treat HTTP %s as zero usage", async (status) => {
    mockResponse({ message: "Billing access denied" }, status);
    await expect(usage.execute({ account: "o", account_type: "user" }, CONTEXT)).rejects.toMatchObject({ status });
  });

  it("paginates budgets and excludes alert recipients", async () => {
    const mock = mockResponse({ budgets: [{ id: "b", budget_product_sku: "actions", budget_amount: 10, budget_alerting: { alert_recipients: ["private"] } }], has_next_page: true, total_count: 2 });
    const result = await budgets.execute({ org: "o", ...PAGE }, CONTEXT);
    expect(mock.mock.calls[0]![0]).toBe("https://api.github.com/organizations/o/settings/billing/budgets?page=1&per_page=30");
    expect(result).toMatchObject({ next_page: 2, total_count: 2 });
    expect("budgets" in result && result.budgets?.[0]).not.toHaveProperty("budget_alerting");
  });

  it("reads a budget's consumed amount", async () => {
    const mock = mockResponse({ id: "b", consumed_amount: 5, budget_amount: 10, prevent_further_usage: true });
    const result = await budgets.execute({ org: "o", budget_id: "b", ...PAGE }, CONTEXT);
    expect(mock.mock.calls[0]![0]).toBe("https://api.github.com/organizations/o/settings/billing/budgets/b");
    expect(result).toMatchObject({ budget: { consumed_amount: 5, prevent_further_usage: true } });
  });
});
