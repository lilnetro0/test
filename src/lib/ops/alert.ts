type AlertSeverity = "info" | "warning" | "error";

type AlertFields = Record<string, string | number | boolean | null | undefined>;

const lastSent = new Map<string, number>();
const MIN_INTERVAL_MS = 5 * 60 * 1000;

function shouldSend(key: string): boolean {
  const now = Date.now();
  const prev = lastSent.get(key) ?? 0;
  if (now - prev < MIN_INTERVAL_MS) return false;
  lastSent.set(key, now);
  return true;
}

/**
 * Optional ops paging — Slack Incoming Webhook and/or PagerDuty Events API v2.
 * No-op when unset. Rate-limited per title (5 min) to avoid storms.
 */
export async function sendOpsAlert(opts: {
  title: string;
  text: string;
  severity?: AlertSeverity;
  fields?: AlertFields;
}): Promise<void> {
  const severity = opts.severity ?? "error";
  if (severity === "info") return;
  if (!shouldSend(opts.title)) return;

  const webhook = (process.env.OPS_ALERT_WEBHOOK_URL as string | undefined)?.trim();
  const pdKey = (process.env.OPS_PAGERDUTY_ROUTING_KEY as string | undefined)?.trim();
  if (!webhook && !pdKey) return;

  const line = opts.text.slice(0, 2000);
  const tasks: Promise<unknown>[] = [];

  if (webhook) {
    tasks.push(
      fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: `[Nexus ${severity}] ${opts.title}: ${line}`,
        }),
      }).catch(() => undefined),
    );
  }

  if (pdKey) {
    tasks.push(
      fetch("https://events.pagerduty.com/v2/enqueue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          routing_key: pdKey,
          event_action: "trigger",
          payload: {
            summary: `${opts.title}: ${line}`.slice(0, 1024),
            severity: severity === "error" ? "error" : "warning",
            source: "nexus",
            custom_details: opts.fields ?? {},
          },
        }),
      }).catch(() => undefined),
    );
  }

  await Promise.all(tasks);
}
