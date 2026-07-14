-- Seed catalog data matching src/lib/mock-data.ts (no auth.users required).

insert into public.games (id, name, short, category, tint, text_tint) values
  ('fortnite', 'Fortnite', 'FTN', 'battle-royale', 'bg-purple-500/20', 'text-purple-300'),
  ('valorant', 'Valorant', 'VAL', 'shooter', 'bg-rose-500/20', 'text-rose-300'),
  ('lol', 'League of Legends', 'LOL', 'moba', 'bg-amber-500/20', 'text-amber-300'),
  ('cs2', 'Counter-Strike 2', 'CS2', 'shooter', 'bg-orange-500/20', 'text-orange-300'),
  ('minecraft', 'Minecraft', 'MC', 'sandbox', 'bg-emerald-500/20', 'text-emerald-300'),
  ('apex', 'Apex Legends', 'APX', 'battle-royale', 'bg-red-500/20', 'text-red-300'),
  ('rocket', 'Rocket League', 'RL', 'sports', 'bg-sky-500/20', 'text-sky-300'),
  ('overwatch', 'Overwatch 2', 'OW', 'shooter', 'bg-orange-400/20', 'text-orange-200'),
  ('dota2', 'Dota 2', 'DT2', 'moba', 'bg-red-600/20', 'text-red-300'),
  ('cod', 'Call of Duty: Warzone', 'COD', 'battle-royale', 'bg-lime-500/20', 'text-lime-300'),
  ('elden', 'Elden Ring', 'ELD', 'sandbox', 'bg-yellow-600/20', 'text-yellow-300'),
  ('gta', 'GTA Online', 'GTA', 'sandbox', 'bg-pink-500/20', 'text-pink-300')
on conflict (id) do nothing;

insert into public.hubs (id, game_id, slug, name, member_count, active_count) values
  ('11111111-1111-1111-1111-111111111101', 'fortnite', 'fortnite', 'Fortnite Hub', 42800, '1.2k'),
  ('11111111-1111-1111-1111-111111111102', 'valorant', 'valorant', 'Valorant Protocol', 89200, '4.8k'),
  ('11111111-1111-1111-1111-111111111103', 'lol', 'lol', 'Summoner''s Rift', 61500, '3.4k'),
  ('11111111-1111-1111-1111-111111111104', 'cs2', 'cs2', 'CS2 Global', 54300, '2.1k'),
  ('11111111-1111-1111-1111-111111111105', 'minecraft', 'minecraft', 'Overworld', 33900, '980'),
  ('11111111-1111-1111-1111-111111111106', 'apex', 'apex', 'Apex Games', 28100, '1.7k'),
  ('11111111-1111-1111-1111-111111111107', 'rocket', 'rocket', 'Boost Arena', 18700, '640'),
  ('11111111-1111-1111-1111-111111111108', 'overwatch', 'overwatch', 'Watchpoint', 22400, '820')
on conflict (slug) do nothing;

-- Fortnite channels
insert into public.text_channels (hub_id, slug, name, topic, position) values
  ('11111111-1111-1111-1111-111111111101', 'general', 'general', 'General chatter for the squad.', 0),
  ('11111111-1111-1111-1111-111111111101', 'lfg-ranked', 'lfg-ranked', 'Looking for group — ranked only.', 1),
  ('11111111-1111-1111-1111-111111111101', 'clips-and-highlights', 'clips-and-highlights', 'Post your best plays.', 2),
  ('11111111-1111-1111-1111-111111111101', 'tournaments', 'tournaments', null, 3),
  ('11111111-1111-1111-1111-111111111101', 'creative-builds', 'creative-builds', null, 4)
on conflict (hub_id, slug) do nothing;

insert into public.voice_channels (hub_id, slug, name, position, livekit_room_name) values
  ('11111111-1111-1111-1111-111111111101', 'lobby-alpha', 'Lobby Alpha', 0, 'nexus-fortnite-lobby-alpha'),
  ('11111111-1111-1111-1111-111111111101', 'competitive', 'Competitive', 1, 'nexus-fortnite-competitive'),
  ('11111111-1111-1111-1111-111111111101', 'creative', 'Creative Build', 2, 'nexus-fortnite-creative'),
  ('11111111-1111-1111-1111-111111111101', 'afk', 'AFK', 3, 'nexus-fortnite-afk')
on conflict (hub_id, slug) do nothing;

-- Valorant channels
insert into public.text_channels (hub_id, slug, name, topic, position) values
  ('11111111-1111-1111-1111-111111111102', 'general', 'general', 'Official hub for team coordination.', 0),
  ('11111111-1111-1111-1111-111111111102', 'lfg-competitive', 'lfg-competitive', null, 1),
  ('11111111-1111-1111-1111-111111111102', 'lineups-and-strats', 'lineups-and-strats', null, 2),
  ('11111111-1111-1111-1111-111111111102', 'clips', 'clips', null, 3)
on conflict (hub_id, slug) do nothing;

insert into public.voice_channels (hub_id, slug, name, position, livekit_room_name) values
  ('11111111-1111-1111-1111-111111111102', 'squad-bravo', 'Squad Bravo', 0, 'nexus-valorant-squad-bravo'),
  ('11111111-1111-1111-1111-111111111102', 'warmup', 'Warmup Lobby', 1, 'nexus-valorant-warmup'),
  ('11111111-1111-1111-1111-111111111102', '5-stack', '5-Stack Ranked', 2, 'nexus-valorant-5-stack')
on conflict (hub_id, slug) do nothing;

-- Remaining hubs: general + lfg + clips text, main lobby + ranked voice
insert into public.text_channels (hub_id, slug, name, position)
select h.id, c.slug, c.name, c.pos
from public.hubs h
cross join (values
  ('general', 'general', 0),
  ('lfg', 'lfg', 1),
  ('clips', 'clips', 2)
) as c(slug, name, pos)
where h.slug in ('lol', 'cs2', 'minecraft', 'apex', 'rocket', 'overwatch')
on conflict (hub_id, slug) do nothing;

insert into public.voice_channels (hub_id, slug, name, position, livekit_room_name)
select h.id, c.slug, c.name, c.pos, 'nexus-' || h.slug || '-' || c.slug
from public.hubs h
cross join (values
  ('lobby', 'Main Lobby', 0),
  ('ranked', 'Ranked', 1)
) as c(slug, name, pos)
where h.slug in ('lol', 'cs2', 'minecraft', 'apex', 'rocket', 'overwatch')
on conflict (hub_id, slug) do nothing;
