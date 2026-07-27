import { defineTool } from "eve/tools";
import { z } from "zod";
import { get, put } from "../lib/github.js";

const NOTIFICATION_FILTERS = ["default", "include_read_notifications", "only_participating"] as const;

export default defineTool({
  description:
    "List notifications for the authenticated user (issues, PRs, mentions, etc.). Optionally mark them all as read.",
  inputSchema: z.object({
    filter: z
      .enum(NOTIFICATION_FILTERS)
      .default("default")
      .describe(
        "default: subscribed threads; include_read_notifications: also include already-read; only_participating: only threads the user commented on or were mentioned in.",
      ),
    mark_all_read: z
      .boolean()
      .default(false)
      .describe("If true, mark every currently-unread notification as read after returning them."),
  }),
  async execute({ filter, mark_all_read }) {
    const params = new URLSearchParams({ filter });
    const items = await get<Record<string, unknown>[]>(
      `/notifications?${params.toString()}`,
    );
    const projected = items.map((n) => ({
      id: n.id,
      unread: n.unread,
      reason: n.reason,
      updated_at: n.updated_at,
      subject: {
        title: (n.subject as { title?: unknown } | null)?.title,
        type: (n.subject as { type?: unknown } | null)?.type,
        url: (n.subject as { url?: unknown } | null)?.url,
        latest_comment_url: (n.subject as { latest_comment_url?: unknown } | null)
          ?.latest_comment_url,
      },
      repository: (n.repository as { full_name?: unknown } | null)?.full_name,
    }));
    if (mark_all_read) {
      await put("/notifications", { read: true });
    }
    return projected;
  },
});
