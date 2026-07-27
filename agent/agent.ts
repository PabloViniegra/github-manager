import { defineAgent } from "eve";
import { mockModel } from "eve/evals";

const isEval = process.env.EVE_EVAL === "1";

const model = isEval
  ? mockModel(({ lastUserMessage, toolResults }) => {
      if (toolResults.length > 0) {
        return { text: "Aquí tienes el resultado." };
      }
      const msg = (lastUserMessage ?? "").toLowerCase().trim();
        if (/^(hola|hi|hello|buenos|buenas)/.test(msg)) {
          return { text: "Hola, soy GitHub Manager. ¿Qué necesitas?" };
        }
        if (msg.includes("crea") || msg.includes("create")) {
          return {
            text: "Voy a crear la issue.",
            toolCalls: [
              {
                name: "github_create_issue",
                input: { owner: "test", repo: "test", title: "Test issue" },
              },
            ],
          };
        }
        if (msg.includes("repo")) {
          return {
            text: "Listo, voy a listar tus repos.",
            toolCalls: [
              {
                name: "github_list_my_repos",
                input: { visibility: "all", sort: "updated" },
              },
            ],
          };
        }
      return { text: "No estoy seguro de qué hacer con eso." };
    })
  : "poolside/laguna-s-2.1-free";

export default defineAgent({
  model,
  modelContextWindowTokens: isEval ? 200_000 : undefined,
});
