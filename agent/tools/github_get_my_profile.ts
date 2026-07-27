import { defineTool } from "eve/tools";
import { z } from "zod";
import { get } from "../lib/github.js";

export default defineTool({
  description:
    "Return the authenticated user's GitHub profile (login, name, bio, company, location, public/private repo counts, plan).",
  inputSchema: z.object({}),
  async execute() {
    const profile = await get<Record<string, unknown>>("/user");
    return profile;
  },
});
