import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "A request to create an issue routes to a write tool, which then parks for human approval. The tool never executes, so GITHUB_TOKEN is not required.",
  async test(t) {
    await t.send("Crea una issue de prueba en mi repo test");
    t.calledTool("github_create_issue", { status: "pending", count: 1 });
    t.parked();
  },
});
