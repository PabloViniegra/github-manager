import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "A repository update routes to its write tool, which parks for human approval before execution.",
  async test(t) {
    await t.send('Actualiza la descripción del repo test/test a "Proyecto actualizado".');
    t.calledTool("github_update_repo", { status: "pending", count: 1 });
    t.parked();
  },
});
