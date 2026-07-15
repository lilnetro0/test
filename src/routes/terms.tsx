import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { useT, translateStatic } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.terms") },
      { name: "description", content: "Terms of Service for the Nexus gaming chat and voice app." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useT();
  return (
    <LegalPage title={t("legal.terms.title")} updated="July 15, 2026">
      <LegalSection title={t("legal.terms.s1")}>
        <p>{t("legal.terms.s1p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.terms.s2")}>
        <p>{t("legal.terms.s2p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.terms.s3")}>
        <p>{t("legal.terms.s3p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.terms.s4")}>
        <p>{t("legal.terms.s4p")}</p>
        <ul className="ms-5 list-disc space-y-1">
          <li>{t("legal.terms.s4l1")}</li>
          <li>{t("legal.terms.s4l2")}</li>
          <li>{t("legal.terms.s4l3")}</li>
          <li>{t("legal.terms.s4l4")}</li>
          <li>{t("legal.terms.s4l5")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.terms.s5")}>
        <p>{t("legal.terms.s5p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.terms.s6")}>
        <p>{t("legal.terms.s6p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.terms.s7")}>
        <p>{t("legal.terms.s7p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.terms.s8")}>
        <p>{t("legal.terms.s8p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.terms.s9")}>
        <p>
          {t("legal.terms.s9p")}{" "}
          <a href="mailto:legal@nexus.app" className="text-accent hover:underline">
            legal@nexus.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
