/** Shared LFG channel detection (AF7 jump / AF11 composer helper). */

export function isLfgChannel(channel: { slug?: string; name: string }): boolean {
  if (channel.slug === "lfg") return true;
  return /lfg|بحث عن فريق|البحث عن فريق/i.test(channel.name);
}
