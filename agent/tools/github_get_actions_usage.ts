import { defineTool } from "eve/tools";
import { z } from "zod";
import { get } from "../lib/github.js";

export default defineTool({
  description: "Get monthly Actions billing usage for a user or organization via enhanced billing. Defaults to the current month. Requires billing access; 403/404 is not zero usage. Usage does not prove remaining included credits, payment health, or that a run can start.",
  inputSchema: z.object({
    account: z.string().min(1),
    account_type: z.enum(["user", "organization"]),
    year: z.number().int().min(2000).max(9999).optional(),
    month: z.number().int().min(1).max(12).optional(),
    repository: z.string().min(1).optional().describe("Optional owner/repository filter."),
  }),
  async execute({ account, account_type, year, month, repository }) {
    const params = new URLSearchParams({ product: "Actions" });
    if (year !== undefined) params.set("year", String(year));
    if (month !== undefined) params.set("month", String(month));
    if (repository) params.set("repository", repository);
    const scope = account_type === "user" ? "users" : "organizations";
    const result = await get<Record<string, unknown>>(
      `/${scope}/${encodeURIComponent(account)}/settings/billing/usage/summary?${params}`,
    );
    return {
      account,
      account_type,
      time_period: result.timePeriod,
      usage_items: result.usageItems,
      quota_available: null,
      limitation: "Usage is not a remaining-credit or payment-status API. Confirm allowance and applicable limits before conditional reruns.",
    };
  },
});
