import { Crown, Flame, Moon, Play, RotateCcw, Target, Vote as VoteIcon } from 'lucide-react';
import type { ActionType, GameState } from '@/game/types';
import { ROLES, ROLE_KEYS, TEAM_STYLE, type RoleKey } from '@/game/roles';
import { canGuess, findPlayer } from '@/game/state';
import RolePortrait from '@/components/RolePortrait';

interface Props {
  game: GameState;
  meId: string;
  isHost: boolean;
  guessRole: RoleKey;
  onGuessRole: (role: RoleKey) => void;
  onAction: (type: ActionType, target: string | null) => void;
  onToVote: () => void;
  onForce: () => void;
  onReset: () => void;
}

export default function ActionPanel({ game, meId, isHost, guessRole, onGuessRole, onAction, onToVote, onForce, onReset }: Props) {
  const me = findPlayer(game, meId);
  const role = me?.role;
  const def = role ? ROLES[role] : null;
  const notes = game.priv[meId] ?? [];
  const canUseGuess = !!me && canGuess(me) && me.alive && !me.gu && (game.phase === 'day' || game.phase === 'vote');
  const canPass = !!me?.alive && game.phase === 'night' && (role === 'arsonist' || (role === 'jackal' && game.day > 1));
  const done = !!game.night.done[meId];

  return (
    <div className="space-y-5">
      {me && def && role && (
        <section className="glass flex flex-col gap-5 p-5 animate-fade-up sm:flex-row sm:items-start">
          <RolePortrait role={role} size="lg" className="mx-auto shrink-0" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-gold-100">{def.label}</h2>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs ${TEAM_STYLE[def.team].chip}`}>{def.team}</span>
              {!me.alive && <span className="rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs text-rose-200">死亡</span>}
            </div>
            <p className="text-sm leading-relaxed text-night-200">{def.desc}</p>
            {canGuess(me) && (
              <p className="flex items-center gap-1.5 text-xs text-gold-300">
                <Target className="h-3.5 w-3.5" /> ゲッサー能力: 昼・投票中に1回だけ役職を当てられる{me.gu ? '(使用済み)' : ''}
              </p>
            )}
            {notes.length > 0 && (
              <ul className="space-y-1.5 rounded-xl bg-night-950/50 p-3 text-sm">
                {notes.map((n, i) => (
                  <li key={i} className="flex gap-2 animate-fade-up">
                    <Moon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            )}
            {canUseGuess && (
              <label className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-night-200">当てる役職</span>
                <select className="field w-auto py-1.5" value={guessRole} onChange={(e) => onGuessRole(e.target.value as RoleKey)}>
                  {ROLE_KEYS.filter((k) => k !== 'modguesser').map((k) => (
                    <option key={k} value={k}>{ROLES[k].label}</option>
                  ))}
                </select>
                <span className="text-xs text-night-300">(プレイヤーカードの「当てる」で指名。外すと自分が死亡)</span>
              </label>
            )}
            {canPass && (
              <div className="flex flex-wrap gap-2">
                {role === 'arsonist' && (
                  <button onClick={() => onAction('ignite', null)} className="btn-wolf">
                    <Flame className="h-4 w-4" /> 点火
                  </button>
                )}
                <button onClick={() => onAction('pass', null)} className="btn-ghost">
                  今夜は何もしない{done ? '(行動済み)' : ''}
                </button>
              </div>
            )}
            {me.alive && game.phase === 'night' && role === 'hunter' && game.day === 1 && (
              <p className="text-xs text-night-300">初日の夜は襲撃がないため護衛は不要です。</p>
            )}
          </div>
        </section>
      )}

      {!me && <p className="glass p-4 text-sm text-night-200">観戦中です(ゲーム開始後は参加できません)。</p>}

      {isHost && (
        <section className="glass flex flex-wrap items-center gap-2 p-4">
          <span className="mr-2 text-sm text-sky-200">ホスト操作</span>
          {game.phase === 'day' && (
            <button onClick={onToVote} className="btn-primary">
              <VoteIcon className="h-4 w-4" /> 投票を開始
            </button>
          )}
          {(game.phase === 'night' || game.phase === 'vote') && (
            <button onClick={onForce} className="btn-ghost">
              <Play className="h-4 w-4" /> 未行動を待たず進行
            </button>
          )}
          {game.phase === 'end' && (
            <button onClick={onReset} className="btn-primary">
              <RotateCcw className="h-4 w-4" /> ロビーへ戻る
            </button>
          )}
          <Crown className="ml-auto h-4 w-4 text-gold-300" />
        </section>
      )}
    </div>
  );
}
