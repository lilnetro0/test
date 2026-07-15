-- Phase 2 catch-up: official hubs for catalog games that seed previously omitted.
-- Idempotent. Prefer seed.sql on fresh local resets; this helps existing projects.

insert into public.hubs (id, game_id, slug, name, member_count, active_count) values
  ('11111111-1111-1111-1111-111111111109', 'dota2', 'dota2', 'Ancient Grounds', 41200, '2.9k'),
  ('11111111-1111-1111-1111-11111111110a', 'cod', 'cod', 'Verdansk Ops', 67000, '3.6k'),
  ('11111111-1111-1111-1111-11111111110b', 'elden', 'elden', 'The Lands Between', 15200, '580'),
  ('11111111-1111-1111-1111-11111111110c', 'gta', 'gta', 'Los Santos', 39400, '1.9k')
on conflict (slug) do nothing;

insert into public.text_channels (hub_id, slug, name, position)
select h.id, c.slug, c.name, c.pos
from public.hubs h
cross join (values
  ('general', 'general', 0),
  ('lfg', 'lfg', 1),
  ('clips', 'clips', 2)
) as c(slug, name, pos)
where h.slug in ('dota2', 'cod', 'elden', 'gta')
on conflict (hub_id, slug) do nothing;

insert into public.voice_channels (hub_id, slug, name, position, livekit_room_name)
select h.id, c.slug, c.name, c.pos, 'nexus-' || h.slug || '-' || c.slug
from public.hubs h
cross join (values
  ('lobby', 'Main Lobby', 0),
  ('ranked', 'Ranked', 1)
) as c(slug, name, pos)
where h.slug in ('dota2', 'cod', 'elden', 'gta')
on conflict (hub_id, slug) do nothing;
