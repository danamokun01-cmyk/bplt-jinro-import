import type { RoleKey } from './roles';

export type Phase = 'lobby' | 'night' | 'day' | 'vote' | 'end';
export type TimedPhase = 'night' | 'day' | 'vote';
export type ChatChannel = 'all' | 'wolf' | 'mason' | 'dead';

export type ActionType =
  | 'join'
  | 'vote'
  | 'guess'
  | 'wolf'
  | 'seer'
  | 'guard'
  | 'steal'
  | 'snipe'
  | 'jackal'
  | 'recruit'
  | 'douse'
  | 'ignite'
  | 'sheriff'
  | 'track'
  | 'sorc'
  | 'pass';

export interface ActionRow {
  pid: string;
  type: ActionType;
  target: string | null;
}

export interface ChatMessage {
  id: number;
  pid: string;
  name: string;
  channel: ChatChannel;
  text: string;
}

export interface Player {
  id: string;
  name: string;
  alive: boolean;
  role?: RoleKey;
  used?: boolean;
  lover?: string;
  oil?: boolean;
  gu?: boolean;
  guesser?: boolean;
  star?: boolean;
}

export interface NightState {
  wolf: Record<string, string>;
  acts: Record<string, string>;
  done: Record<string, boolean>;
  shots: { by: string; t: string }[];
  track: Record<string, string>;
  seer?: string;
  guard?: string;
  thief?: string;
  thiefBy?: string;
  snipe?: string;
  jk?: string;
  rec?: string;
  douse?: string;
  ignite?: boolean;
  sorc?: string;
}

export interface Timers {
  night: number;
  day: number;
  vote: number;
}

export interface GameState {
  host: string;
  phase: Phase;
  day: number;
  players: Player[];
  log: string[];
  priv: Record<string, string[]>;
  night: NightState;
  votes: Record<string, string>;
  T: Timers;
  deadline: number | null;
  lastExec: string | null;
  recruited: boolean;
  teruteru: boolean;
}
