-- Cresd 人狼 用テーブル。Cresd Chat と同じ Supabase の SQL Editor に丸ごと貼り付けて Run。
-- Chat の messages / Adv Tools の link_messages・memo_tabs には触りません(テーブル名は jinro_ で始まります)。
-- 何度実行しても壊れません。

-- ===== 部屋(ゲームの状態) =====
create table if not exists public.jinro_rooms (
  id         text primary key check (char_length(id) between 1 and 40),
  state      jsonb not null check (pg_column_size(state) <= 400000),
  updated_at timestamptz not null default now()
);
create index if not exists jinro_rooms_updated_idx on public.jinro_rooms (updated_at);

-- ===== 参加者からホストへの操作 =====
create table if not exists public.jinro_actions (
  id         bigint generated always as identity primary key,
  room       text not null check (char_length(room) between 1 and 40),
  pid        text not null check (char_length(pid) between 1 and 64),
  type       text not null check (char_length(type) between 1 and 20),
  target     text check (target is null or char_length(target) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists jinro_actions_room_id_idx on public.jinro_actions (room, id);
create index if not exists jinro_actions_created_idx on public.jinro_actions (created_at);

-- ===== チャット =====
create table if not exists public.jinro_chat (
  id         bigint generated always as identity primary key,
  room       text not null check (char_length(room) between 1 and 40),
  pid        text not null check (char_length(pid) between 1 and 64),
  name       text not null check (char_length(name) between 1 and 20),
  channel    text not null check (channel in ('all','wolf','mason','dead')),
  text       text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists jinro_chat_room_id_idx on public.jinro_chat (room, id);
create index if not exists jinro_chat_created_idx on public.jinro_chat (created_at);

-- ===== 行レベルセキュリティ =====
-- 部屋: 誰でも読める・作れる・更新できる(ホスト判定は画面側。ログイン不要の作りのため)。削除は不可。
-- 操作・チャット: 誰でも読める・書ける。更新・削除は不可。
alter table public.jinro_rooms   enable row level security;
alter table public.jinro_actions enable row level security;
alter table public.jinro_chat    enable row level security;

drop policy if exists "jinro rooms read"   on public.jinro_rooms;
drop policy if exists "jinro rooms insert" on public.jinro_rooms;
drop policy if exists "jinro rooms update" on public.jinro_rooms;
create policy "jinro rooms read"   on public.jinro_rooms for select to anon, authenticated using (true);
create policy "jinro rooms insert" on public.jinro_rooms for insert to anon, authenticated with check (true);
create policy "jinro rooms update" on public.jinro_rooms for update to anon, authenticated using (true) with check (true);

drop policy if exists "jinro actions read"   on public.jinro_actions;
drop policy if exists "jinro actions insert" on public.jinro_actions;
create policy "jinro actions read"   on public.jinro_actions for select to anon, authenticated using (true);
create policy "jinro actions insert" on public.jinro_actions for insert to anon, authenticated with check (true);

drop policy if exists "jinro chat read"   on public.jinro_chat;
drop policy if exists "jinro chat insert" on public.jinro_chat;
create policy "jinro chat read"   on public.jinro_chat for select to anon, authenticated using (true);
create policy "jinro chat insert" on public.jinro_chat for insert to anon, authenticated with check (true);

-- ===== 掃除(古い部屋・操作・チャットを削除) =====
--   部屋: 3日間更新がなければ削除 / 操作: 1日で削除 / チャット: 3日で削除
-- 期間を変えるときは interval を書き換えて、このファイルをもう一度 Run してください。
create or replace function public.jinro_cleanup() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.jinro_rooms   where updated_at < now() - interval '3 days';
  delete from public.jinro_actions where created_at < now() - interval '1 day';
  delete from public.jinro_chat    where created_at < now() - interval '3 days';
end $$;
revoke all on function public.jinro_cleanup() from public, anon, authenticated;

-- ===== 書き込み前のチェック =====
create or replace function public.jinro_rooms_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    -- 部屋の乱立防止: 全体で10秒に30部屋まで
    if (select count(*) from public.jinro_rooms where updated_at > now() - interval '10 seconds') >= 30 then
      raise exception 'rate_limited' using errcode = 'P0001';
    end if;
    if random() < 0.02 then perform public.jinro_cleanup(); end if;   -- pg_cron が使えない場合の保険
  end if;
  return new;
end $$;
drop trigger if exists jinro_rooms_guard_bi on public.jinro_rooms;
create trigger jinro_rooms_guard_bi before insert or update on public.jinro_rooms
  for each row execute function public.jinro_rooms_guard();

create or replace function public.jinro_actions_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.type   := btrim(regexp_replace(new.type,   E'[\\x01-\\x1f\\x7f]', ' ', 'g'));
  new.target := btrim(regexp_replace(coalesce(new.target, ''), E'[\\x01-\\x1f\\x7f]', ' ', 'g'));
  -- 同じ端末: 5秒に20件まで / 同じ部屋: 10秒に100件まで / 全体: 10秒に300件まで
  if (select count(*) from public.jinro_actions where pid = new.pid  and created_at > now() - interval '5 seconds')  >= 20
  or (select count(*) from public.jinro_actions where room = new.room and created_at > now() - interval '10 seconds') >= 100
  or (select count(*) from public.jinro_actions where created_at > now() - interval '10 seconds') >= 300
  then raise exception 'rate_limited' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists jinro_actions_guard_bi on public.jinro_actions;
create trigger jinro_actions_guard_bi before insert on public.jinro_actions
  for each row execute function public.jinro_actions_guard();

create or replace function public.jinro_chat_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.name := btrim(regexp_replace(new.name, E'[\\x01-\\x1f\\x7f]', ' ', 'g'));
  new.text := btrim(regexp_replace(new.text, E'[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f]', ' ', 'g'));
  if new.name = '' or new.text = '' then raise exception 'empty' using errcode = 'P0001'; end if;
  -- 同じ端末: 5秒に5件まで / 同じ部屋: 10秒に40件まで / 全体: 10秒に150件まで
  if (select count(*) from public.jinro_chat where pid = new.pid  and created_at > now() - interval '5 seconds')  >= 5
  or (select count(*) from public.jinro_chat where room = new.room and created_at > now() - interval '10 seconds') >= 40
  or (select count(*) from public.jinro_chat where created_at > now() - interval '10 seconds') >= 150
  then raise exception 'rate_limited' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists jinro_chat_guard_bi on public.jinro_chat;
create trigger jinro_chat_guard_bi before insert on public.jinro_chat
  for each row execute function public.jinro_chat_guard();

-- 投稿後: 各部屋のチャットは新しい200件だけ残す
create or replace function public.jinro_chat_trim() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.jinro_chat
   where room = new.room
     and id < (select id from public.jinro_chat where room = new.room order by id desc offset 200 limit 1);
  return null;
end $$;
drop trigger if exists jinro_chat_trim_ai on public.jinro_chat;
create trigger jinro_chat_trim_ai after insert on public.jinro_chat
  for each row execute function public.jinro_chat_trim();

-- ===== リアルタイム配信(すでに追加済みならスキップ) =====
do $$
declare t text;
begin
  foreach t in array array['jinro_rooms','jinro_actions','jinro_chat'] loop
    if not exists (select 1 from pg_publication_tables
                    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- (任意) 毎日掃除する。使う場合は先に Database → Extensions で pg_cron を有効にして、下の2行の先頭の -- を外す
-- select cron.schedule('cresd-jinro-cleanup', '30 18 * * *', $$ select public.jinro_cleanup() $$);
