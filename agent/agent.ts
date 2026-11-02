import { defineAgent } from "eve";
import { mockModel } from "eve/evals";

const isEval = process.env.EVE_EVAL === "1";

const model = isEval
  ? mockModel(({ lastUserMessage, toolResults }) => {
      if (toolResults.length > 0) {
        return { text: "Aquí tienes el resultado." };
      }
      const msg = (lastUserMessage ?? "").toLowerCase().trim();
      if (msg.includes("relanza") && msg.includes("workflow")) {
        return {
          text: "Voy a solicitar aprobación para reintentar la ejecución.",
          toolCalls: [
            {
              name: "github_rerun_workflow",
              input: {
                owner: "test",
                repo: "test",
                run_id: 42,
                mode: "failed_jobs",
              },
            },
          ],
        };
      }
        if (msg.includes("actualiza") && msg.includes("repo")) {
          return {
            text: "Voy a actualizar el repositorio.",
            toolCalls: [
              {
                name: "github_update_repo",
                input: {
                  owner: "test",
                  repo: "test",
                  description: "Proyecto actualizado",
                },
              },
            ],
          };
        }
        if (
          (msg.includes("aprueba") || msg.includes("approve")) &&
          (msg.includes("pr") || msg.includes("pull"))
        ) {
          return {
            text: "Voy a aprobar el pull request.",
            toolCalls: [
              {
                name: "github_approve_pull_request",
                input: { owner: "test", repo: "test", pull_number: 42 },
              },
            ],
          };
        }
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
  : "openai/gpt-6-luna";

export default defineAgent({
  model,
  modelContextWindowTokens: isEval ? 200_000 : undefined,
});
