/*
# Create werewolf game tables

1. New Tables
- `rooms`: one row per game room. `state` holds the whole game (players, phase, log, votes, timers).
- `actions`: player commands (join, vote, night abilities). The room host reads these in realtime and applies them.
- `chat`: room chat messages, split by channel (all, wolf, mason, dead).

2. Security
- RLS enabled on all three tables.
- No sign-in exists, so the anon key needs read and write access. Policies are USING (true) because the data is intentionally shared between players in a room.
- Grants limited to the verbs the app uses (no UPDATE or DELETE on actions or chat).

3. Notes
- Input length and enum checks guard against oversized or unexpected values.
- Tables are added to the realtime publication so players see changes live.
*/

CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY CHECK (char_length(id) BETWEEN 1 AND 40),
  state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS actions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  pid text NOT NULL CHECK (char_length(pid) BETWEEN 1 AND 64),
  type text NOT NULL CHECK (type IN ('join','vote','guess','wolf','seer','guard','steal','snipe','jackal','recruit','douse','ignite','sheriff','track','sorc','pass')),
  target text CHECK (char_length(target) <= 120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  pid text NOT NULL CHECK (char_length(pid) BETWEEN 1 AND 64),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 20),
  channel text NOT NULL CHECK (channel IN ('all','wolf','mason','dead')),
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS actions_room_idx ON actions (room);
CREATE INDEX IF NOT EXISTS chat_room_idx ON chat (room, id);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON rooms TO anon, authenticated;
GRANT SELECT, INSERT ON actions TO anon, authenticated;
GRANT SELECT, INSERT ON chat TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_rooms" ON rooms;
CREATE POLICY "anon_select_rooms" ON rooms FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_actions" ON actions;
CREATE POLICY "anon_select_actions" ON actions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_actions" ON actions;
CREATE POLICY "anon_insert_actions" ON actions FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_chat" ON chat;
CREATE POLICY "anon_select_chat" ON chat FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_chat" ON chat;
CREATE POLICY "anon_insert_chat" ON chat FOR INSERT TO anon, authenticated WITH CHECK (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE actions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
