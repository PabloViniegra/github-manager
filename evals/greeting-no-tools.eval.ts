import { defineEval } from "eve/evals";

export default defineEval({
  description: "A greeting does not trigger any tool call.",
  async test(t) {
    await t.send("Hola, ¿qué tal?");
    t.succeeded();
    t.usedNoTools();
  },
});
