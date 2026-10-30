import type { GameState, Player } from './types';
import { ROLES, isRoleKey } from './roles';
import { addLog, canGuess, emptyNight, findPlayer, setPhase } from './state';
import { betray, checkWinner, dawn, kill } from './engine';

export function tally(S: GameState) {
  const counts: Record<string, number> = {};
  Object.entries(S.votes).forEach(([voter, target]) => {
    counts[target] = (counts[target] || 0) + (findPlayer(S, voter)?.role === 'mayor' ? 2 : 1);
  });
  let max = 0;
  let top: string[] = [];
  for (const k in counts) {
    if (counts[k] > max) {
      max = counts[k];
      top = [k];
    } else if (counts[k] === max) top.push(k);
  }
  addLog(S, '投票結果: ' + Object.entries(counts).map(([k, v]) => `${findPlayer(S, k)?.name}:${v}票`).join(' '));

  let out: Player[] = [];
  if (top.length === 1) {
    const victim = top[0];
    out = kill(S, victim);
    S.lastExec = victim;
    betray(S, out);
    const v = findPlayer(S, victim);
    if (v?.role === 'teruteru') S.teruteru = true;
    if (v?.role === 'poisoner') {
      const voters = Object.keys(S.votes).filter((k) => S.votes[k] === victim && findPlayer(S, k)?.alive);
      if (voters.length) {
        out.push(...kill(S, voters[Math.random() * voters.length | 0]));
        betray(S, out);
      }
    }
    const extra = out.length > 1 ? ` 道連れ/後追い: ${out.slice(1).map((p) => p.name).join('、')}` : '';
    addLog(S, `${v?.name} が処刑されました。${extra}`);
  } else {
    addLog(S, '同票のため処刑は行われませんでした。');
  }

  if (S.teruteru) {
    S.teruteru = false;
    S.votes = {};
    S.phase = 'end';
    S.deadline = null;
    addLog(S, '★ てるてるが処刑されました！【てるてるの単独勝利】');
    return;
  }
  S.votes = {};
  if (!checkWinner(S)) {
    setPhase(S, 'night');
    S.day++;
    S.night = emptyNight();
  }
}

export function toVote(S: GameState) {
  setPhase(S, 'vote');
  S.votes = {};
  addLog(S, '--- 投票の時間です ---');
}

export function doGuess(S: GameState, p: Player | undefined, targetValue: string) {
  const [id, role] = targetValue.split(':');
  const tp = findPlayer(S, id);
  if (!p || !p.alive || p.gu || !canGuess(p) || !tp || !tp.alive || id === p.id) return;
  if (!role || !isRoleKey(role) || role === 'modguesser') return;
  if (!['day', 'vote'].includes(S.phase)) return;

  p.gu = true;
  const guessed = ROLES[role].label;
  let out: Player[];
  if (tp.role === role) {
    addLog(S, `${p.name} が ${tp.name} の役職を【${guessed}】と言い当てた！ ${tp.name} は死亡した。`);
    out = kill(S, tp.id);
  } else {
    addLog(S, `${p.name} が ${tp.name} を【${guessed}】と推理したが外れ、自らも命を落とした。`);
    out = kill(S, p.id);
  }
  if (out.length > 1) addLog(S, '巻き添え: ' + out.slice(1).map((x) => x.name).join('、'));
  betray(S, out);
  Object.keys(S.votes).forEach((k) => {
    if (!findPlayer(S, k)?.alive || !findPlayer(S, S.votes[k])?.alive) delete S.votes[k];
  });
  checkWinner(S);
}

export function forceAdvance(S: GameState) {
  if (S.phase === 'night') dawn(S);
  else if (S.phase === 'vote') tally(S);
}
