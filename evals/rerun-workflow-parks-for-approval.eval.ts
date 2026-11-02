import { defineEval } from "eve/evals";

export default defineEval({
  description: "An Actions rerun parks for approval before any quota-consuming request executes.",
  async test(t) {
    await t.send("Relanza los jobs fallidos del workflow run #42 en test/test.");
    t.calledTool("github_rerun_workflow", { status: "pending", count: 1 });
    t.parked();
  },
});
