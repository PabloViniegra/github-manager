import { defineEval } from "eve/evals";

export default defineEval({
  description:
    "A request to list repositories routes to the read tool. Skipped when GITHUB_TOKEN is not set, because the tool's success depends on the API call.",
  async test(t) {
    if (!process.env.GITHUB_TOKEN) {
      t.skip("Set GITHUB_TOKEN to exercise the read tool end-to-end.");
      return;
    }
    await t.send("Lista mis repositorios");
    t.succeeded();
    t.calledTool("github_list_my_repos");
  },
});
