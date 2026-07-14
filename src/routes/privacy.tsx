import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Nexus" },
      { name: "description", content: "How Nexus collects, uses, and protects your data." },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useT();
  return (
    <LegalPage title={t("legal.privacy.title")} updated="July 15, 2026">
      <LegalSection title={t("legal.privacy.s1")}>
        <ul className="ms-5 list-disc space-y-1">
          <li>{t("legal.privacy.s1l1")}</li>
          <li>{t("legal.privacy.s1l2")}</li>
          <li>{t("legal.privacy.s1l3")}</li>
          <li>{t("legal.privacy.s1l4")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.privacy.s2")}>
        <p>{t("legal.privacy.s2p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.privacy.s3")}>
        <p>{t("legal.privacy.s3p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.privacy.s4")}>
        <p>{t("legal.privacy.s4p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.privacy.s5")}>
        <p>{t("legal.privacy.s5p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.privacy.s6")}>
        <p>{t("legal.privacy.s6p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.privacy.s7")}>
        <p>{t("legal.privacy.s7p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.privacy.s8")}>
        <p>
          {t("legal.privacy.s8p")}{" "}
          <a href="mailto:privacy@nexus.app" className="text-accent hover:underline">
            privacy@nexus.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
