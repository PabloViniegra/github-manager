import { defineTool } from "eve/tools";
import { z } from "zod";
import { projectRun, repositoryPath, runInput } from "../lib/actions.js";
import { get } from "../lib/github.js";

export default defineTool({
  description: "Get an Actions workflow run's current status, attempt, commit and check suite. Use after a rerun to verify progress; acceptance is not success.",
  inputSchema: z.object(runInput),
  async execute({ owner, repo, run_id }) {
    return projectRun(await get<Record<string, unknown>>(
      `${repositoryPath(owner, repo)}/actions/runs/${run_id}`,
    ));
  },
});
