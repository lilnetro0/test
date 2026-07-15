import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { useT, translateStatic } from "@/lib/i18n";

export const Route = createFileRoute("/guidelines")({
  head: () => ({
    meta: [
      { title: translateStatic("meta.page.guidelines") },
      {
        name: "description",
        content: "Community Guidelines for respectful gaming chat and voice on Nexus.",
      },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: GuidelinesPage,
});

function GuidelinesPage() {
  const { t } = useT();
  return (
    <LegalPage title={t("legal.guidelines.title")} updated="July 15, 2026">
      <LegalSection title={t("legal.guidelines.s1")}>
        <p>{t("legal.guidelines.s1p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.guidelines.s2")}>
        <p>{t("legal.guidelines.s2p")}</p>
        <ul className="ms-5 list-disc space-y-1">
          <li>{t("legal.guidelines.s2l1")}</li>
          <li>{t("legal.guidelines.s2l2")}</li>
          <li>{t("legal.guidelines.s2l3")}</li>
          <li>{t("legal.guidelines.s2l4")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.guidelines.s3")}>
        <p>{t("legal.guidelines.s3p")}</p>
        <ul className="ms-5 list-disc space-y-1">
          <li>{t("legal.guidelines.s3l1")}</li>
          <li>{t("legal.guidelines.s3l2")}</li>
          <li>{t("legal.guidelines.s3l3")}</li>
        </ul>
      </LegalSection>
      <LegalSection title={t("legal.guidelines.s4")}>
        <p>{t("legal.guidelines.s4p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.guidelines.s5")}>
        <p>{t("legal.guidelines.s5p")}</p>
      </LegalSection>
      <LegalSection title={t("legal.guidelines.s6")}>
        <p>
          {t("legal.guidelines.s6p")}{" "}
          <a href="mailto:safety@nexus.app" className="text-accent hover:underline">
            safety@nexus.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
