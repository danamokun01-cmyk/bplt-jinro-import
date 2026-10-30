import { useState } from 'react';
import { Play, Settings2, Hourglass, BookOpen } from 'lucide-react';
import type { GameState, Timers } from '@/game/types';
import { ROLES, ROLE_KEYS, TEAM_STYLE, type RoleKey } from '@/game/roles';
import { DEFAULT_TIMERS, autoSetup, type RoleCounts } from '@/game/setup';
import RolePortrait from '@/components/RolePortrait';

interface Props {
  game: GameState;
  isHost: boolean;
  onStart: (counts: RoleCounts, timers: Timers) => Promise<string | null>;
}

export default function Lobby({ game, isHost, onStart }: Props) {
  return (
    <div className="space-y-5">
      <section className="glass p-5 animate-fade-up">
        <h2 className="font-serif text-lg font-bold text-gold-100">参加者 {game.players.length}人</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {game.players.map((p, i) => (
            <span
              key={p.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-fade-up rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm"
            >
              {p.name}
              {p.id === game.host && <span className="ml-1.5 text-xs text-gold-300">ホスト</span>}
            </span>
          ))}
        </div>
      </section>

      {isHost ? (
        <HostSetup key={game.players.length} playerCount={game.players.length} defaults={game.T} onStart={onStart} />
      ) : (
        <section className="glass flex items-center gap-3 p-5 text-night-200">
          <Hourglass className="h-5 w-5 animate-pulse text-gold-300" />
          ホストがゲームを開始するまでお待ちください…
        </section>
      )}

      <section className="glass p-5">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-gold-100">
          <BookOpen className="h-5 w-5" /> 役職図鑑
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {ROLE_KEYS.map((k) => (
            <div key={k} title={ROLES[k].desc} className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-night-950/40 p-3 transition hover:border-white/25">
              <RolePortrait role={k} size="sm" />
              <span className={`rounded-full border px-2 py-0.5 text-[10px] ${TEAM_STYLE[ROLES[k].team].chip}`}>{ROLES[k].team}</span>
              <p className="text-center text-[11px] leading-relaxed text-night-200 opacity-80 transition group-hover:opacity-100">
                {ROLES[k].desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HostSetup({
  playerCount,
  defaults,
  onStart,
}: {
  playerCount: number;
  defaults: Timers;
  onStart: (counts: RoleCounts, timers: Timers) => Promise<string | null>;
}) {
  const [counts, setCounts] = useState<RoleCounts>(() => autoSetup(playerCount));
  const [timers, setTimers] = useState<Timers>(() => ({ ...DEFAULT_TIMERS, ...defaults }));
  const [message, setMessage] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const assigned = ROLE_KEYS.filter((k) => k !== 'sidekick').reduce((sum, k) => sum + counts[k], 0);
  const ok = assigned === playerCount;

  const setCount = (k: RoleKey, v: number) => setCounts((c) => ({ ...c, [k]: Math.max(0, v || 0) }));

  const start = async () => {
    setStarting(true);
    setMessage(await onStart(counts, timers));
    setStarting(false);
  };

  return (
    <section className="glass space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-gold-100">
          <Settings2 className="h-5 w-5" /> 村の編成
        </h2>
        <span className={`rounded-full px-3 py-1 text-sm ${ok ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
          配役 {assigned} / 参加 {playerCount}人
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2">
        {ROLE_KEYS.filter((k) => k !== 'sidekick').map((k) => (
          <label key={k} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-night-950/40 px-3 py-2 text-sm">
            <span className="truncate">{ROLES[k].label}</span>
            <input
              type="number"
              min={0}
              value={counts[k]}
              onChange={(e) => setCount(k, Number(e.target.value))}
              className="field w-16 py-1 text-center"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <span className="text-sm text-night-200">制限時間(秒・0で無制限)</span>
        {(['night', 'day', 'vote'] as const).map((k) => (
          <label key={k} className="space-y-1 text-xs text-night-300">
            <span className="block">{{ night: '夜', day: '昼', vote: '投票' }[k]}</span>
            <input
              type="number"
              min={0}
              value={timers[k]}
              onChange={(e) => setTimers((t) => ({ ...t, [k]: Math.max(0, Number(e.target.value) || 0) }))}
              className="field w-24 py-1.5"
            />
          </label>
        ))}
      </div>

      {message && <p className="animate-shake text-sm text-rose-300">{message}</p>}
      <button onClick={start} disabled={starting} className="btn-primary w-full py-3 text-base">
        <Play className="h-4 w-4" /> ゲーム開始
      </button>
    </section>
  );
}
