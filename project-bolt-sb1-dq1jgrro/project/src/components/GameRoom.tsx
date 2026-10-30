import { useMemo, useState } from 'react';
import { LogOut, Moon, Sun, Cloud, Vote as VoteIcon, Trophy, Loader2 } from 'lucide-react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { getPlayerId } from '@/lib/session';
import { findPlayer, canGuess } from '@/game/state';
import type { Phase } from '@/game/types';
import { ROLE_KEYS, type RoleKey } from '@/game/roles';
import Lobby from '@/components/Lobby';
import PlayerGrid from '@/components/PlayerGrid';
import ActionPanel from '@/components/ActionPanel';
import SidePanel from '@/components/SidePanel';

interface Props {
  roomId: string;
  name: string;
  onLeave: () => void;
}

const SCENES: Record<Phase, { src: string; label: string }> = {
  lobby: { src: 'https://images.pexels.com/photos/15334609/pexels-photo-15334609.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', label: '村の広場' },
  night: { src: 'https://images.pexels.com/photos/10685030/pexels-photo-10685030.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', label: '夜' },
  day: { src: 'https://images.pexels.com/photos/9783072/pexels-photo-9783072.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', label: '朝・昼' },
  vote: { src: 'https://images.pexels.com/photos/5871562/pexels-photo-5871562.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', label: '投票' },
  end: { src: 'https://images.pexels.com/photos/9783072/pexels-photo-9783072.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', label: '終幕' },
};

const PHASE_LABEL: Record<Phase, string> = { lobby: 'ロビー', night: '夜', day: '昼(議論)', vote: '投票', end: '終了' };

export default function GameRoom({ roomId, name, onLeave }: Props) {
  const [playerId] = useState(() => getPlayerId());
  const me = useMemo(() => ({ id: playerId, name }), [playerId, name]);
  const room = useGameRoom(roomId, me);
  const [guessRole, setGuessRole] = useState<RoleKey>(ROLE_KEYS[0]);

  const S = room.game;
  const phase: Phase = S?.phase ?? 'lobby';
  const scene = SCENES[phase];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 -z-10">
          {(Object.keys(SCENES) as Phase[]).map((p) => (
            <img
              key={p}
              src={SCENES[p].src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ${p === phase ? 'opacity-45' : 'opacity-0'} animate-ken-burns`}
            />
          ))}
          <div className={`absolute inset-0 ${phase === 'vote' ? 'bg-rose-950/60' : 'bg-night-950/75'}`} />
        </div>

      {S && (
        <div key={`${phase}-${S.day}`} className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center">
          <div className="animate-banner-in rounded-2xl border border-gold-300/40 bg-night-950/80 px-10 py-5 font-serif text-3xl font-bold text-gold-100 shadow-2xl shadow-black/60 backdrop-blur">
            {phase === 'night' && <Moon className="mx-auto mb-2 h-8 w-8 text-gold-300" />}
            {phase === 'day' && <Sun className="mx-auto mb-2 h-8 w-8 text-gold-300" />}
            {phase === 'vote' && <VoteIcon className="mx-auto mb-2 h-8 w-8 text-rose-300" />}
            {phase === 'end' && <Trophy className="mx-auto mb-2 h-8 w-8 text-gold-300" />}
            {phase === 'lobby' && <Cloud className="mx-auto mb-2 h-8 w-8 text-sky-300" />}
            {S.phase === 'night' ? `${S.day}夜目` : scene.label}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <header className="glass flex flex-wrap items-center justify-between gap-3 px-5 py-3 animate-fade-up">
          <div className="min-w-0">
            <p className="truncate font-serif text-lg font-bold text-gold-100">部屋: {roomId}</p>
            <p className="flex items-center gap-2 text-sm text-night-200">
              <span className="rounded-full border border-gold-300/40 bg-gold-400/15 px-2.5 py-0.5 text-gold-100">
                {PHASE_LABEL[phase]}
              </span>
              {S && S.day > 0 && <span>{S.day}日目</span>}
              {room.isHost && <span className="text-sky-300">(ホスト)</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Countdown deadline={S?.deadline ?? null} now={room.now} />
            <button onClick={onLeave} className="btn-ghost" title="この部屋から退出">
              <LogOut className="h-4 w-4" /> 退出
            </button>
          </div>
        </header>

        {room.error && <div className="glass p-5 text-rose-200">{room.error}</div>}
        {room.loading && (
          <div className="glass flex items-center justify-center gap-3 p-10 text-night-200">
            <Loader2 className="h-5 w-5 animate-spin" /> 部屋を読み込んでいます…
          </div>
        )}

        {S && (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <main className="min-w-0 space-y-5">
              {phase === 'lobby' ? (
                <Lobby game={S} isHost={room.isHost} onStart={room.hostStart} />
              ) : (
                <>
                  <ActionPanel
                    game={S}
                    meId={me.id}
                    isHost={room.isHost}
                    guessRole={guessRole}
                    onGuessRole={setGuessRole}
                    onAction={room.sendAction}
                    onToVote={room.hostToVote}
                    onForce={room.hostForce}
                    onReset={room.hostReset}
                  />
                  <PlayerGrid
                    game={S}
                    meId={me.id}
                    guessRole={guessRole}
                    onAction={room.sendAction}
                    canGuessNow={canGuess(findPlayer(S, me.id)) && !!findPlayer(S, me.id)?.alive}
                  />
                </>
              )}
            </main>
            <SidePanel
              game={S}
              meId={me.id}
              chats={room.chats}
              onSend={room.sendChat}
            />
          </div>
        )}

        {room.notice && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-toast-in rounded-lg bg-night-900/95 px-4 py-2 text-sm text-night-50 shadow-xl ring-1 ring-white/15">
            {room.notice}
          </div>
        )}
      </div>
    </div>
  );
}

function Countdown({ deadline, now }: { deadline: number | null; now: number }) {
  if (!deadline) return null;
  const left = Math.max(0, Math.ceil((deadline - now) / 1000));
  const urgent = left <= 10;
  return (
    <div className={`min-w-[88px] rounded-xl border px-3 py-1.5 text-center ${urgent ? 'animate-tick-pulse border-rose-400/60 text-rose-200' : 'border-white/15 text-night-100'}`}>
      <p className="text-[10px] tracking-widest text-night-300">残り</p>
      <p className="font-serif text-xl font-bold tabular-nums">{left}秒</p>
    </div>
  );
}

