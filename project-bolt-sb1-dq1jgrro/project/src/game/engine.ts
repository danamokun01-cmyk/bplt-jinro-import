import type { GameState, Player } from './types';
import { addLog, alivePlayers, appearsWolf, findPlayer, isFoxSide, isJackalTeam, isWolf, notePrivate, roleLabel, setPhase } from './state';

export function kill(S: GameState, id: string): Player[] {
  const p = findPlayer(S, id);
  if (!p || !p.alive) return [];
  p.alive = false;
  const out: Player[] = [p];
  if (p.role === 'jackal') {
    const sk = alivePlayers(S).find((x) => x.role === 'sidekick');
    if (sk) {
      sk.role = 'jackal';
      notePrivate(S, sk.id, 'ジャッカルが死亡し、あなたが【ジャッカル】になった');
    }
  }
  if (p.lover && findPlayer(S, p.lover)?.alive) out.push(...kill(S, p.lover));
  if (p.role === 'cat' || p.role === 'evilcat') {
    let c = alivePlayers(S);
    if (p.role === 'evilcat') {
      const nonWolves = c.filter((x) => !isWolf(x));
      if (nonWolves.length) c = nonWolves;
    }
    if (c.length) out.push(...kill(S, c[Math.random() * c.length | 0].id));
  }
  return out;
}

export function betray(S: GameState, out: Player[]) {
  if (alivePlayers(S).some(isFoxSide)) return;
  alivePlayers(S)
    .filter((p) => p.role === 'betrayer')
    .forEach((b) => out.push(...kill(S, b.id)));
}

export function hit(S: GameState, id: string, out: Player[], wolfAttack: boolean) {
  const p = findPlayer(S, id);
  if (!p || !p.alive || id === S.night.guard || p.role === 'fox') return;
  if (p.role === 'knight' && !p.used) {
    p.used = true;
    notePrivate(S, id, `${S.day}夜目: 襲撃されたが鎧で耐えた(鎧は消滅)`);
    return;
  }
  if (wolfAttack && p.role === 'cursed') {
    p.role = 'werewolf';
    const wolves = S.players.filter(isWolf).map((x) => x.name).join('、');
    notePrivate(S, id, '人狼に襲撃され、人狼に覚醒した！ 仲間: ' + wolves);
    S.players
      .filter((x) => isWolf(x) && x.id !== id)
      .forEach((x) => notePrivate(S, x.id, `${p.name} が襲撃され、人狼に覚醒した`));
    return;
  }
  out.push(...kill(S, id));
}

export function checkWinner(S: GameState): boolean {
  const al = alivePlayers(S);
  const count = (f: (p: Player) => boolean) => al.filter(f).length;
  const W = count(isWolf);
  const J = count(isJackalTeam);
  const A = count((p) => p.role === 'arsonist');
  const V = count((p) => !isWolf(p) && !isJackalTeam(p) && !isFoxSide(p) && p.role !== 'arsonist');
  const fox = al.some(isFoxSide);
  let r: string | null = null;
  if (!al.length) r = 'なし(全滅・引き分け)';
  else if (al.length === 1 && al[0].role === 'arsonist') r = 'アーソニスト(単独)';
  else if (al.length === 2 && al.every((p) => p.lover)) r = '恋人';
  else if (A > 0 && V === 0 && W === 0 && J === 0) r = 'アーソニスト(単独)';
  else if (W === 0 && J === 0 && A === 0) r = '村人陣営';
  else if (W > 0 && W >= V + J) r = '人狼陣営';
  else if (J > 0 && J >= V + W) r = 'ジャッカル陣営';
  if (!r) return false;
  S.phase = 'end';
  S.deadline = null;
  if (fox && ['村人陣営', '人狼陣営', 'ジャッカル陣営'].includes(r)) {
    addLog(S, `★ ${r}が勝利条件を満たしたが、妖狐陣営が生き残っているため【妖狐陣営の単独勝利】！`);
  } else {
    addLog(S, `★ ${r}の勝利！`);
  }
  al.filter((p) => p.role === 'opportunist').forEach((p) => addLog(S, `★ ${p.name}(オポチュニスト)は生存したため追加勝利`));
  return true;
}

export function dawn(S: GameState) {
  const N = S.night;
  if (N.thief && N.thiefBy) {
    const th = findPlayer(S, N.thiefBy);
    const tg = findPlayer(S, N.thief);
    if (th && tg) {
      th.role = tg.role;
      tg.role = 'thief';
      const wolfNote = isWolf(th) ? ' 人狼の仲間: ' + S.players.filter(isWolf).map((p) => p.name).join('、') : '';
      notePrivate(S, th.id, `1夜目: ${tg.name} と入れ替わり、あなたは【${roleLabel(th.role)}】になった${wolfNote}`);
    }
  }

  const counts: Record<string, number> = {};
  let target: string | null = null;
  let max = 0;
  Object.values(N.wolf).forEach((x) => (counts[x] = (counts[x] || 0) + 1));
  for (const k in counts) {
    if (counts[k] > max || (counts[k] === max && Math.random() < 0.5)) {
      target = k;
      max = counts[k];
    }
  }

  if (N.rec) {
    const tg = findPlayer(S, N.rec);
    const jk = alivePlayers(S).find((x) => x.role === 'jackal');
    S.recruited = true;
    if (jk && tg && tg.alive && !isWolf(tg) && !isFoxSide(tg) && tg.role !== 'arsonist') {
      tg.role = 'sidekick';
      notePrivate(S, tg.id, 'あなたはジャッカルに勧誘され【サイドキック】になった。ジャッカル: ' + jk.name);
      notePrivate(S, jk.id, tg.name + ' をサイドキックにした');
    } else if (jk) {
      notePrivate(S, jk.id, '勧誘に失敗した');
    }
  }

  const o: Player[] = [];
  if (target && S.day > 1) hit(S, target, o, true);
  if (N.jk) hit(S, N.jk, o, false);
  if (N.seer && findPlayer(S, N.seer)?.role === 'fox') o.push(...kill(S, N.seer));
  if (N.snipe && findPlayer(S, N.snipe)?.alive) o.push(...kill(S, N.snipe));
  N.shots.forEach((x) => {
    const by = findPlayer(S, x.by);
    const tg = findPlayer(S, x.t);
    if (by?.alive && tg?.alive) {
      if (isWolf(tg) || isJackalTeam(tg) || isFoxSide(tg)) o.push(...kill(S, tg.id));
      else o.push(...kill(S, by.id));
    }
  });
  if (N.ignite) alivePlayers(S).filter((p) => p.oil).forEach((p) => o.push(...kill(S, p.id)));
  betray(S, o);

  alivePlayers(S)
    .filter((g) => g.role === 'gravekeeper')
    .forEach((g) =>
      notePrivate(
        S,
        g.id,
        `${S.day}日目: 昨夜の死者 → ` + (o.length ? o.map((p) => `${p.name}=${roleLabel(p.role)}`).join('、') : 'なし')
      )
    );

  addLog(S, `--- ${S.day}日目の朝 ---`);
  addLog(S, o.length ? `${o.map((p) => p.name).join('、')} が死亡しました。` : '昨夜の犠牲者はいませんでした。');

  o.filter((p) => p.role === 'bait' && p.id === target).forEach((b) => {
    const votes = Object.keys(N.wolf).filter((k) => N.wolf[k] === b.id);
    if (votes.length) {
      const shouter = findPlayer(S, votes[Math.random() * votes.length | 0]);
      addLog(S, `${b.name} は死の間際に ${shouter?.name} の名を叫んだ…`);
    }
  });

  Object.entries(N.track).forEach(([trackerId, tg]) => {
    if (!findPlayer(S, trackerId)?.alive) return;
    const acted = N.acts[tg];
    const actedName = acted ? findPlayer(S, acted)?.name : undefined;
    notePrivate(S, trackerId, `${S.day}夜目: ${findPlayer(S, tg)?.name} の夜の行動 → ` + (actedName ?? '誰にも行動しなかった'));
  });

  if (S.players.some((p) => p.role === 'baker')) {
    addLog(S, alivePlayers(S).some((p) => p.role === 'baker') ? 'パンの焼けるいい香りがする。' : '今朝はパンが焼けなかった…パン屋が死んだようだ。');
  }

  if (S.lastExec) {
    const executed = findPlayer(S, S.lastExec);
    alivePlayers(S)
      .filter((p) => p.role === 'medium')
      .forEach((md) =>
        notePrivate(S, md.id, `${S.day}日目: 昨日処刑された ${executed?.name} は【${appearsWolf(executed) ? '人狼' : '人間'}】でした`)
      );
  }
  S.lastExec = null;
  setPhase(S, 'day');
  S.votes = {};
  if (o.some((p) => p.role === 'suicidal')) {
    S.phase = 'end';
    S.deadline = null;
    addLog(S, '★ 自殺願望者が夜に死亡！【自殺願望者の単独勝利】');
  } else {
    checkWinner(S);
  }
}
