import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Nexus" },
      { name: "description", content: "How Nexus uses cookies and local storage." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  const { t } = useT();
  return (
    <LegalPage title={t("legal.cookies.title")} updated="July 15, 2026">
      <LegalSection title={t("legal.cookies.s1")}>
        <p>{t("legal.cookies.s1p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.cookies.s2")}>
        <ul className="ms-5 list-disc space-y-1">
          <li>{t("legal.cookies.s2l1")}</li>
          <li>{t("legal.cookies.s2l2")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.cookies.s3")}>
        <ul className="ms-5 list-disc space-y-1">
          <li>{t("legal.cookies.s3l1")}</li>
          <li>{t("legal.cookies.s3l2")}</li>
          <li>{t("legal.cookies.s3l3")}</li>
          <li>{t("legal.cookies.s3l4")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.cookies.s4")}>
        <p>{t("legal.cookies.s4p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.cookies.s5")}>
        <p>{t("legal.cookies.s5p")}</p>
      </LegalSection>
    </LegalPage>
  );
}
