import { Crosshair, Star, Vote as VoteIcon } from 'lucide-react';
import type { ActionType, GameState, Player } from '@/game/types';
import { nightButtonsFor, type TargetButton } from '@/game/abilities';
import { findPlayer } from '@/game/state';
import type { RoleKey } from '@/game/roles';
import RolePortrait from '@/components/RolePortrait';

interface Props {
  game: GameState;
  meId: string;
  guessRole: RoleKey;
  onAction: (type: ActionType, target: string | null) => void;
  canGuessNow: boolean;
}

const TONE: Record<TargetButton['tone'], string> = {
  wolf: 'btn-wolf',
  seer: 'btn-seer',
  safe: 'btn-safe',
  ghost: 'btn-ghost',
};

export default function PlayerGrid({ game, meId, guessRole, onAction, canGuessNow }: Props) {
  const me = findPlayer(game, meId);
  const reveal = game.phase === 'end';
  return (
    <section className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
      {game.players.map((x, i) => (
        <PlayerCard
          key={x.id}
          index={i}
          player={x}
          isMe={x.id === meId}
          reveal={reveal}
          buttons={nightButtonsFor(game, me, x)}
          showGuess={canGuessNow && x.alive && x.id !== meId && (game.phase === 'day' || game.phase === 'vote')}
          onGuess={() => onAction('guess', `${x.id}:${guessRole}`)}
          onAction={onAction}
          voteable={game.phase === 'vote' && !!me?.alive && x.alive && x.id !== meId}
          votedFor={game.votes[meId] === x.id}
          canAct={!!me?.alive && x.alive && x.id !== meId}
        />
      ))}
    </section>
  );
}

function PlayerCard({
  index,
  player,
  isMe,
  reveal,
  buttons,
  showGuess,
  onGuess,
  onAction,
  voteable,
  votedFor,
  canAct,
}: {
  index: number;
  player: Player;
  isMe: boolean;
  reveal: boolean;
  buttons: TargetButton[];
  showGuess: boolean;
  onGuess: () => void;
  onAction: (type: ActionType, target: string | null) => void;
  voteable: boolean;
  votedFor: boolean;
  canAct: boolean;
}) {
  const dead = !player.alive;
  return (
    <div
      style={{ animationDelay: `${index * 50}ms` }}
      className={`glass animate-fade-up flex flex-col items-center gap-3 p-4 transition duration-300 ${dead ? 'opacity-50 grayscale' : 'hover:-translate-y-0.5 hover:border-white/25'} ${isMe ? 'ring-2 ring-gold-400/60' : ''}`}
    >
      <RolePortrait role={player.role} hidden={!reveal} size="sm" />
      <div className="text-center">
        <p className={`font-medium ${dead ? 'line-through' : ''}`}>
          {player.name}
          {isMe && <span className="ml-1 text-xs text-gold-300">(あなた)</span>}
        </p>
        <p className="mt-0.5 flex items-center justify-center gap-2 text-xs text-night-300">
          {dead ? '死亡' : '生存'}
          {player.star && <Star className="h-3.5 w-3.5 fill-gold-300 text-gold-300" />}
          {player.oil && <span className="text-amber-300">油</span>}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5">
        {canAct &&
          buttons.map((b) => (
            <button
              key={b.label}
              onClick={() => onAction(b.type, player.id)}
              className={`${TONE[b.tone]} px-2.5 py-1.5 text-xs ${b.active ? 'ring-2 ring-white/70' : ''}`}
            >
              {b.active && '✓ '}
              {b.label}
            </button>
          ))}
        {voteable && (
          <button onClick={() => onAction('vote', player.id)} className={`btn-primary px-2.5 py-1.5 text-xs ${votedFor ? 'ring-2 ring-white/70' : ''}`}>
            <VoteIcon className="h-3.5 w-3.5" /> {votedFor ? '投票済' : '投票'}
          </button>
        )}
        {showGuess && (
          <button onClick={onGuess} className="btn-safe px-2.5 py-1.5 text-xs">
            <Crosshair className="h-3.5 w-3.5" /> 当てる
          </button>
        )}
      </div>
    </div>
  );
}
