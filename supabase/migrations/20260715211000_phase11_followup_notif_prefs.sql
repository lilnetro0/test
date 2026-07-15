-- Phase 11 follow-up — notification preference filters

alter table public.user_prefs
  add column if not exists notif_sound boolean not null default true,
  add column if not exists notif_mentions_only boolean not null default false,
  add column if not exists notif_match_dnd boolean not null default false;

comment on column public.user_prefs.notif_sound is
  'Play a short sound with in-app notification toasts (Phase 11 follow-up).';
comment on column public.user_prefs.notif_mentions_only is
  'When true, only mention notifications toast/push (Phase 11 follow-up).';
comment on column public.user_prefs.notif_match_dnd is
  'Silence toasts while the document is fullscreen (client-only; Phase 11 follow-up).';
