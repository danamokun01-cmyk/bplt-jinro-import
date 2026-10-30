import type { GameState, Player, Timers } from './types';
import { ROLE_KEYS, type RoleKey } from './roles';
import { addLog, emptyNight, isJackalTeam, isWolf, notePrivate, setPhase } from './state';

export type RoleCounts = Record<RoleKey, number>;

export const DEFAULT_TIMERS: Timers = { night: 60, day: 180, vote: 60 };

const ASSIGNABLE = (k: RoleKey) => k !== 'sidekick' && k !== 'modguesser';

export function emptyCounts(): RoleCounts {
  return Object.fromEntries(ROLE_KEYS.map((k) => [k, 0])) as RoleCounts;
}

export function autoSetup(n: number): RoleCounts {
  const w = Math.max(1, Math.round(n / 4));
  const bw = n >= 12 ? 1 : 0;
  const eg = n >= 11 ? 1 : 0;
  const c = emptyCounts();
  Object.assign(c, {
    werewolf: w - bw - eg,
    evilguesser: eg,
    bigwolf: bw,
    seer: 1,
    hunter: n >= 6 ? 1 : 0,
    medium: n >= 7 ? 1 : 0,
    madman: n >= 8 ? 1 : 0,
    knight: n >= 8 ? 1 : 0,
    thief: n >= 9 ? 1 : 0,
    cat: n >= 9 ? 1 : 0,
    teruteru: n >= 10 ? 1 : 0,
    mason: n >= 10 ? 2 : 0,
    fanatic: n >= 11 ? 1 : 0,
    fox: n >= 11 ? 1 : 0,
    baker: n >= 12 ? 1 : 0,
    betrayer: n >= 13 ? 1 : 0,
    mayor: n >= 13 ? 1 : 0,
    cursed: n >= 14 ? 1 : 0,
    lover: n >= 14 ? 2 : 0,
    sheriff: n >= 14 ? 1 : 0,
    gravekeeper: n >= 15 ? 1 : 0,
    kogitsune: n >= 15 ? 1 : 0,
    opportunist: n >= 15 ? 1 : 0,
    sniper: n >= 16 ? 1 : 0,
    bait: n >= 16 ? 1 : 0,
    tracker: n >= 16 ? 1 : 0,
    poisoner: n >= 17 ? 1 : 0,
    jackal: n >= 17 ? 1 : 0,
    sorcerer: n >= 18 ? 1 : 0,
    arsonist: n >= 18 ? 1 : 0,
    suicidal: n >= 19 ? 1 : 0,
    niceguesser: n >= 8 ? 1 : 0,
    star: n >= 9 ? 1 : 0,
    wolfpossessed: n >= 13 ? 1 : 0,
  });
  const trimOrder: RoleKey[] = [
    'wolfpossessed', 'suicidal', 'arsonist', 'sorcerer', 'jackal', 'poisoner', 'tracker', 'bait', 'sniper',
    'opportunist', 'kogitsune', 'gravekeeper', 'sheriff', 'lover', 'cursed', 'mayor', 'betrayer', 'baker',
    'fanatic', 'teruteru', 'thief', 'cat', 'knight', 'mason', 'madman', 'medium', 'hunter', 'fox',
  ];
  const total = () => ROLE_KEYS.filter(ASSIGNABLE).reduce((sum, k) => sum + c[k], 0);
  for (const k of trimOrder) {
    while (total() > n && c[k] > 0) c[k]--;
  }
  if (c.lover % 2) c.lover--;
  c.villager = Math.max(0, n - total());
  return c;
}

export function createRoomState(hostId: string, hostName: string): GameState {
  return {
    host: hostId,
    phase: 'lobby',
    day: 0,
    players: [{ id: hostId, name: hostName, alive: true }],
    log: [],
    priv: {},
    night: emptyNight(),
    votes: {},
    T: { ...DEFAULT_TIMERS },
    deadline: null,
    lastExec: null,
    recruited: false,
    teruteru: false,
  };
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function startGame(S: GameState, counts: RoleCounts, timers: Timers): string | null {
  const n = S.players.length;
  const deck: RoleKey[] = [];
  for (const k of ROLE_KEYS) {
    if (!ASSIGNABLE(k)) continue;
    for (let i = 0; i < counts[k]; i++) deck.push(k);
  }
  if (counts.lover % 2) return '恋人は偶数人にしてください';
  if (n < 4 || deck.length !== n) return `4人以上で、役職の合計(${deck.length})を人数(${n})に合わせてください`;

  const roles = shuffle(deck);
  S.T = { ...timers };
  S.players.forEach((p, i) => {
    p.role = roles[i];
    p.alive = true;
    delete p.used;
    delete p.lover;
    delete p.oil;
    delete p.gu;
    delete p.guesser;
    delete p.star;
  });
  setPhase(S, 'night');
  S.recruited = false;
  S.day = 1;
  S.night = emptyNight();
  S.votes = {};
  S.priv = {};
  S.lastExec = null;
  S.teruteru = false;
  S.log = ['ゲーム開始！ 1夜目です(初日の襲撃はありません)。'];

  const lovers = S.players.filter((p) => p.role === 'lover');
  for (let i = 0; i + 1 < lovers.length; i += 2) {
    const [a, b] = [lovers[i], lovers[i + 1]];
    a.lover = b.id;
    b.lover = a.id;
    notePrivate(S, a.id, '恋人: ' + b.name);
    notePrivate(S, b.id, '恋人: ' + a.name);
  }

  S.players.filter((p) => p.role === 'star').forEach((p) => {
    p.star = true;
    addLog(S, `★ ${p.name} はスターです！(全員に公開)`);
  });

  const guessers = Math.min(counts.modguesser || 0, n);
  const candidates = shuffle(S.players.filter((p) => p.role !== 'niceguesser' && p.role !== 'evilguesser'));
  candidates.slice(0, guessers).forEach((p) => {
    p.guesser = true;
    notePrivate(S, p.id, 'あなたにはモディファイア【ゲッサー】の能力が付与された');
  });

  const namesOf = (role: RoleKey) => S.players.filter((p) => p.role === role).map((p) => p.name).join('、');
  const wolfNames = S.players.filter(isWolf).map((p) => p.name).join('、');
  const jackalTeam = S.players.filter(isJackalTeam);
  S.players.forEach((p: Player) => {
    if (isWolf(p)) notePrivate(S, p.id, '人狼の仲間: ' + wolfNames);
    if (p.role === 'fanatic') notePrivate(S, p.id, '人狼は: ' + wolfNames);
    if (isJackalTeam(p) && jackalTeam.length > 1) {
      notePrivate(S, p.id, 'ジャッカル陣営: ' + jackalTeam.map((x) => x.name).join('、'));
    }
    if (p.role === 'mason') notePrivate(S, p.id, '共有者: ' + namesOf('mason'));
    if (p.role === 'betrayer' || p.role === 'kogitsune') notePrivate(S, p.id, '妖狐は: ' + namesOf('fox'));
    if (p.role === 'fox' && namesOf('kogitsune')) notePrivate(S, p.id, '子狐は: ' + namesOf('kogitsune'));
  });
  return null;
}

export function resetGame(S: GameState) {
  S.phase = 'lobby';
  S.deadline = null;
  S.day = 0;
  S.log = [];
  S.priv = {};
  S.night = emptyNight();
  S.votes = {};
  S.players.forEach((p) => {
    p.alive = true;
    delete p.role;
  });
}
