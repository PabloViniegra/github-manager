import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { post } from "../lib/github.js";

export default defineTool({
  description:
    "Create a new repository under the authenticated user. Requires human approval because it creates persistent, public-facing state.",
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[A-Za-z0-9._-]+$/, "Invalid repo name")
      .describe("Repository name (slug)."),
    description: z.string().optional().describe("Short description."),
    private: z
      .boolean()
      .default(false)
      .describe("If true, the repo is private. Defaults to public."),
    auto_init: z
      .boolean()
      .default(true)
      .describe("If true, initialize with a README. Defaults to true."),
  }),
  approval: always(),
  async execute(input) {
    return post<Record<string, unknown>>("/user/repos", input);
  },
});
