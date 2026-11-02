import { defineTool } from "eve/tools";
import { z } from "zod";
import { paginationInput } from "../lib/actions.js";
import { get } from "../lib/github.js";

function projectBudget(budget: Record<string, unknown>) {
  return {
    id: budget.id,
    budget_scope: budget.budget_scope,
    budget_entity_name: budget.budget_entity_name,
    budget_type: budget.budget_type,
    budget_product_sku: budget.budget_product_sku,
    budget_amount: budget.budget_amount,
    consumed_amount: budget.consumed_amount,
    prevent_further_usage: budget.prevent_further_usage,
  };
}

export default defineTool({
  description: "Read organization billing budgets (admin or billing manager required). List budgets first; pass budget_id for current consumed_amount. Inspect Actions product/SKU and all applicable scopes. No equivalent personal-account budget endpoint is available. Does not change spending limits or confirm payment health.",
  inputSchema: z.object({
    org: z.string().min(1),
    budget_id: z.string().min(1).optional(),
    ...paginationInput,
  }),
  async execute({ org, budget_id, page, per_page }) {
    const path = `/organizations/${encodeURIComponent(org)}/settings/billing/budgets`;
    if (budget_id) {
      return { budget: projectBudget(await get<Record<string, unknown>>(`${path}/${encodeURIComponent(budget_id)}`)) };
    }
    const result = await get<{ budgets: Record<string, unknown>[]; has_next_page?: boolean; total_count?: number }>(
      `${path}?page=${page}&per_page=${per_page}`,
    );
    return {
      budgets: result.budgets.map(projectBudget),
      total_count: result.total_count,
      next_page: (result.has_next_page ?? result.budgets.length === per_page) ? page + 1 : null,
    };
  },
});
