import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { patch } from "../lib/github.js";

export default defineTool({
  description:
    "Mark a single notification thread as read. Requires human approval because it mutates the user's notification state.",
  inputSchema: z.object({
    thread_id: z.string().min(1).describe("Notification thread id from github_list_notifications."),
  }),
  approval: always(),
  async execute({ thread_id }) {
    await patch(`/notifications/threads/${thread_id}`, {
      last_read_at: new Date().toISOString(),
    });
    return { thread_id, last_read_at: "now" };
  },
});
