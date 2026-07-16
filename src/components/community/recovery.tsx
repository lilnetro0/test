import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function CommunityNotFound({ slug }: { slug?: string }) {
  const { t } = useT();
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="nx-caption text-accent">{t("community.notFound.eyebrow")}</p>
      <h1 className="nx-display text-2xl text-white">{t("community.notFound.title")}</h1>
      <p className="max-w-sm text-sm text-stone-400">
        {slug
          ? t("community.notFound.bodySlug", { slug })
          : t("community.notFound.body")}
      </p>
      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        <Button asChild variant="accent" className="w-full">
          <Link to="/">{t("community.notFound.ctaHome")}</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/discover">{t("community.notFound.ctaDiscover")}</Link>
        </Button>
      </div>
    </div>
  );
}

export function ChannelNotFound({
  hubSlug,
}: {
  hubSlug: string;
}) {
  const { t } = useT();
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="nx-caption text-accent">{t("community.channelNotFound.eyebrow")}</p>
      <h1 className="nx-display text-2xl text-white">{t("community.channelNotFound.title")}</h1>
      <p className="max-w-sm text-sm text-stone-400">{t("community.channelNotFound.body")}</p>
      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        <Button asChild variant="accent" className="w-full">
          <Link to="/c/$hubSlug" params={{ hubSlug }}>
            {t("community.channelNotFound.ctaHome")}
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/c/$hubSlug" params={{ hubSlug }} hash="channels">
            {t("community.channelNotFound.ctaChannels")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function MembershipRequired({ hubSlug }: { hubSlug: string }) {
  const { t } = useT();
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="nx-caption text-accent">{t("community.memberRequired.eyebrow")}</p>
      <h1 className="nx-display text-2xl text-white">{t("community.memberRequired.title")}</h1>
      <p className="max-w-sm text-sm text-stone-400">{t("community.memberRequired.body")}</p>
      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        <Button asChild variant="accent" className="w-full">
          <Link to="/c/$hubSlug" params={{ hubSlug }}>
            {t("community.memberRequired.ctaHome")}
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link to="/discover">{t("community.memberRequired.ctaDiscover")}</Link>
        </Button>
      </div>
    </div>
  );
}
