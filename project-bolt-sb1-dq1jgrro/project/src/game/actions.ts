import type { ActionRow, GameState, Player } from './types';
import { alivePlayers, appearsWolf, findPlayer, isJackalTeam, isWolf, notePrivate } from './state';
import { dawn } from './engine';
import { doGuess, tally } from './vote';

export function applyAction(S: GameState, a: ActionRow) {
  const p = findPlayer(S, a.pid);
  const t = a.target ?? '';
  const N = S.night;
  const tp = findPlayer(S, t);

  if (a.type === 'guess') {
    doGuess(S, p, t);
  } else if (a.type === 'join') {
    if (S.phase === 'lobby' && !p && S.players.length < 20 && t) {
      S.players.push({ id: a.pid, name: t, alive: true });
    }
  } else if (S.phase === 'night' && p?.alive && (a.type === 'pass' || a.type === 'ignite')) {
    if (a.type === 'ignite' && p.role === 'arsonist') {
      N.ignite = true;
      N.done[a.pid] = true;
    }
    if (a.type === 'pass' && (p.role === 'arsonist' || (p.role === 'jackal' && S.day > 1))) N.done[a.pid] = true;
  } else if (S.phase === 'night' && p?.alive && tp?.alive) {
    applyNightAbility(S, a, p, tp);
  } else if (a.type === 'vote' && S.phase === 'vote' && p?.alive && tp?.alive && t !== a.pid) {
    S.votes[a.pid] = t;
  }
  progress(S);
}

function applyNightAbility(S: GameState, a: ActionRow, p: Player, tp: Player) {
  const N = S.night;
  const t = tp.id;
  N.acts[p.id] = t;
  if (a.type === 'wolf' && isWolf(p) && S.day > 1 && !isWolf(tp)) N.wolf[p.id] = t;
  if (a.type === 'seer' && p.role === 'seer' && !N.seer && t !== p.id) {
    N.seer = t;
    notePrivate(S, p.id, `${S.day}夜目: ${tp.name} は【${appearsWolf(tp) ? '人狼' : '人間'}】でした`);
  }
  if (a.type === 'guard' && p.role === 'hunter' && t !== p.id) N.guard = t;
  if (a.type === 'steal' && p.role === 'thief' && S.day === 1 && !N.thief && t !== p.id && tp.role !== 'lover' && tp.role !== 'star') {
    N.thief = t;
    N.thiefBy = p.id;
    notePrivate(S, p.id, `入れ替え先に ${tp.name} を選びました(夜明けに成立)`);
  }
  if (a.type === 'snipe' && p.role === 'sniper' && S.day > 1 && !p.used && t !== p.id) {
    N.snipe = t;
    p.used = true;
    notePrivate(S, p.id, `${S.day}夜目: ${tp.name} を狙撃した`);
  }
  if (a.type === 'jackal' && p.role === 'jackal' && S.day > 1 && !N.done[p.id] && t !== p.id && !isJackalTeam(tp)) {
    N.jk = t;
    N.done[p.id] = true;
  }
  if (a.type === 'recruit' && p.role === 'jackal' && S.day > 1 && !N.done[p.id] && !S.recruited && t !== p.id) {
    N.rec = t;
    N.done[p.id] = true;
  }
  if (a.type === 'douse' && p.role === 'arsonist' && !N.douse && t !== p.id) {
    N.douse = t;
    tp.oil = true;
    N.done[p.id] = true;
    notePrivate(S, p.id, `${S.day}夜目: ${tp.name} に油を塗った`);
  }
  if (a.type === 'sheriff' && p.role === 'sheriff' && S.day > 1 && t !== p.id && !N.shots.some((x) => x.by === p.id)) {
    N.shots.push({ by: p.id, t });
  }
  if (a.type === 'track' && p.role === 'tracker' && t !== p.id && !N.track[p.id]) N.track[p.id] = t;
  if (a.type === 'sorc' && p.role === 'sorcerer' && !N.sorc && t !== p.id) {
    N.sorc = t;
    notePrivate(S, p.id, `${S.day}夜目: ${tp.name} は【${tp.role === 'seer' ? '占い師' : '占い師ではない'}】`);
  }
}

export function progress(S: GameState) {
  if (S.phase === 'night') {
    const N = S.night;
    const al = alivePlayers(S);
    const ok =
      al.filter((p) => p.role === 'arsonist' || (p.role === 'jackal' && S.day > 1)).every((p) => N.done[p.id]) &&
      (!al.some((p) => p.role === 'thief') || S.day > 1 || !!N.thief) &&
      (!al.some((p) => p.role === 'seer') || !!N.seer) &&
      (S.day === 1 ||
        (al.filter(isWolf).every((p) => N.wolf[p.id]) && (!al.some((p) => p.role === 'hunter') || !!N.guard)));
    if (ok) dawn(S);
  }
  if (S.phase === 'vote' && alivePlayers(S).every((p) => S.votes[p.id])) tally(S);
}
