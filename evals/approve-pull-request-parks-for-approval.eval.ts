import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "A PR approval routes to its write tool, which parks for human approval before execution.",
  async test(t) {
    await t.send("Aprueba el PR #42 en el repo test/test.");
    t.calledTool("github_approve_pull_request", {
      status: "pending",
      count: 1,
    });
    t.parked();
  },
});
