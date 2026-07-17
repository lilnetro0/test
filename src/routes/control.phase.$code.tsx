import { createFileRoute, Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { useT, type TKey } from "@/lib/i18n";

const PHASE_KEYS: Record<string, TKey> = {
  p1: "control.phase.p1",
  p2: "control.phase.p2",
  p3: "control.phase.p3",
  p4: "control.phase.p4",
  p5: "control.phase.p5",
  p6: "control.phase.p6",
};

export const Route = createFileRoute("/control/phase/$code")({
  component: ControlPhaseStub,
});

function ControlPhaseStub() {
  const { t } = useT();
  const { code } = Route.useParams();
  const key = PHASE_KEYS[code.toLowerCase()] ?? "control.phase.unknown";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-8 text-center">
      <Construction className="size-10 text-stone-500" />
      <h1 className="font-display text-xl font-bold text-white">{t("control.phase.title")}</h1>
      <p className="text-sm text-stone-400">{t(key)}</p>
      <p className="rounded-lg bg-white/5 px-3 py-1 font-mono text-xs uppercase text-stone-500">
        {code}
      </p>
      <Link to="/control" className="text-sm font-semibold text-accent">
        {t("control.backDashboard")}
      </Link>
    </div>
  );
}
