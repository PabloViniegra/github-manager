import { defineTool } from "eve/tools";
import { z } from "zod";
import { getAll } from "../lib/github.js";

const SORTS = ["created", "updated", "pushed", "full_name"] as const;
const VISIBILITY = ["all", "public", "private"] as const;
const AFFILIATION = [
  "owner",
  "collaborator",
  "organization_member",
] as const;

export default defineTool({
  description:
    "List repositories owned by, or visible to, the authenticated user. Returns up to 500 repos (10 pages of 50).",
  inputSchema: z.object({
    visibility: z.enum(VISIBILITY).default("all").describe(
      "Filter by visibility. 'all' includes both public and private.",
    ),
    affiliation: z
      .array(z.enum(AFFILIATION))
      .optional()
      .describe("Filter by how the user is associated with the repo."),
    sort: z
      .enum(SORTS)
      .default("updated")
      .describe("Field to sort by; only effective with direction=desc/asc."),
  }),
  async execute({ visibility, affiliation, sort }) {
    const params = new URLSearchParams();
    params.set("visibility", visibility);
    params.set("sort", sort);
    if (affiliation?.length) params.set("affiliation", affiliation.join(","));
    const repos = await getAll<Record<string, unknown>>(
      `/user/repos?${params.toString()}`,
    );
    return repos.map((r) => ({
      full_name: r.full_name,
      description: r.description,
      visibility: r.visibility,
      private: r.private,
      default_branch: r.default_branch,
      open_issues_count: r.open_issues_count,
      stargazers_count: r.stargazers_count,
      updated_at: r.updated_at,
      html_url: r.html_url,
    }));
  },
});
