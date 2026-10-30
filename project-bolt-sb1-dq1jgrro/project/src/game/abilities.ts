import type { ActionType, GameState, Player } from './types';
import { isFoxSide, isJackalTeam, isWolf } from './state';

export interface TargetButton {
  label: string;
  type: ActionType;
  active: boolean;
  tone: 'wolf' | 'seer' | 'safe' | 'ghost';
}

export function nightButtonsFor(S: GameState, me: Player | undefined, x: Player): TargetButton[] {
  if (!me || S.phase !== 'night') return [];
  const N = S.night;
  const out: TargetButton[] = [];
  const add = (label: string, type: ActionType, active: boolean, tone: TargetButton['tone']) =>
    out.push({ label, type, active, tone });

  if (isWolf(me) && S.day > 1 && !isWolf(x)) add('襲撃', 'wolf', N.wolf[me.id] === x.id, 'wolf');
  if (me.role === 'jackal' && S.day > 1 && !N.done[me.id]) {
    if (!isJackalTeam(x)) add('襲撃', 'jackal', false, 'wolf');
    if (!S.recruited && !isWolf(x) && !isFoxSide(x) && x.role !== 'arsonist') add('勧誘', 'recruit', false, 'safe');
  }
  if (me.role === 'arsonist') add(x.oil ? '油を塗り直す' : '油を塗る', 'douse', !!x.oil, 'ghost');
  if (me.role === 'sheriff' && S.day > 1) add('撃つ', 'sheriff', N.shots.some((s) => s.by === me.id && s.t === x.id), 'wolf');
  if (me.role === 'tracker') add('追跡', 'track', N.track[me.id] === x.id, 'seer');
  if (me.role === 'sniper' && S.day > 1 && !me.used) add('狙撃(1回限り)', 'snipe', false, 'wolf');
  if (me.role === 'sorcerer') add('調べる', 'sorc', N.sorc === x.id, 'seer');
  if (me.role === 'thief' && S.day === 1 && x.role !== 'lover' && x.role !== 'star') add('入れ替え', 'steal', N.thief === x.id, 'seer');
  if (me.role === 'seer') add('占う', 'seer', N.seer === x.id, 'seer');
  if (me.role === 'hunter') add('護衛', 'guard', N.guard === x.id, 'safe');
  return out;
}
