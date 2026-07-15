type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, string | number | boolean | null | undefined>;

/**
 * Structured JSON logging for server (and client) — Phase 16.
 * Host platforms ship stdout; no APM SDK required.
 * Errors optionally fan out to OPS_ALERT_WEBHOOK_URL / OPS_PAGERDUTY_ROUTING_KEY.
 */
export function logEvent(
  level: LogLevel,
  event: string,
  fields: LogFields = {},
): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  if (level === "error" && typeof process !== "undefined") {
    void import("./alert")
      .then(({ sendOpsAlert }) =>
        sendOpsAlert({
          title: event,
          text: String(fields.message ?? fields.error ?? event),
          severity: "error",
          fields,
        }),
      )
      .catch(() => undefined);
  }
}
