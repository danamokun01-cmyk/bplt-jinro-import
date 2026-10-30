import type { GameState, NightState, Phase, Player, TimedPhase } from './types';
import { ROLES, type RoleKey } from './roles';

export const isWolf = (p?: Player) =>
  !!p && (p.role === 'werewolf' || p.role === 'bigwolf' || p.role === 'evilguesser' || p.role === 'evilcat');
export const appearsWolf = (p?: Player) =>
  !!p && (p.role === 'werewolf' || p.role === 'evilguesser' || p.role === 'evilcat' || p.role === 'wolfpossessed');
export const isFoxSide = (p?: Player) => !!p && (p.role === 'fox' || p.role === 'kogitsune');
export const isJackalTeam = (p?: Player) => !!p && (p.role === 'jackal' || p.role === 'sidekick');
export const canGuess = (p?: Player) =>
  !!p && (p.role === 'niceguesser' || p.role === 'evilguesser' || !!p.guesser);

export const findPlayer = (S: GameState, id: string | null | undefined) =>
  id ? S.players.find((p) => p.id === id) : undefined;
export const alivePlayers = (S: GameState) => S.players.filter((p) => p.alive);
export const roleLabel = (role?: RoleKey) => (role ? ROLES[role].label : '');

export const emptyNight = (): NightState => ({ wolf: {}, acts: {}, done: {}, shots: [], track: {} });

export function addLog(S: GameState, text: string) {
  S.log.push(text);
}

export function notePrivate(S: GameState, id: string, text: string) {
  (S.priv[id] ??= []).push(text);
}

export function setPhase(S: GameState, phase: Phase) {
  S.phase = phase;
  const t = phase === 'night' || phase === 'day' || phase === 'vote' ? S.T[phase as TimedPhase] : 0;
  S.deadline = t ? Date.now() + t * 1000 : null;
}

export function chatChannelsFor(me?: Player) {
  const options: { value: string; label: string }[] = [{ value: 'all', label: '全体' }];
  if (isWolf(me)) options.push({ value: 'wolf', label: '人狼' });
  if (me?.role === 'mason') options.push({ value: 'mason', label: '共有' });
  if (me && !me.alive) options.push({ value: 'dead', label: '霊界' });
  return options;
}

export function canSeeChannel(S: GameState, me: Player | undefined, channel: string) {
  if (channel === 'all' || S.phase === 'end') return true;
  if (!me) return false;
  if (!me.alive && S.phase !== 'lobby') return true;
  if (channel === 'wolf') return isWolf(me);
  if (channel === 'mason') return me.role === 'mason';
  if (channel === 'dead') return !me.alive;
  return false;
}
