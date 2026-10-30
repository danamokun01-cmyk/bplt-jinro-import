const PLAYER_KEY = 'werewolf.playerId';
const SESSION_KEY = 'werewolf.session';

export interface Session {
  roomId: string;
  name: string;
}

export function getPlayerId(): string {
  const saved = localStorage.getItem(PLAYER_KEY);
  if (saved) return saved;
  const id = crypto.randomUUID();
  localStorage.setItem(PLAYER_KEY, id);
  return id;
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as Session).roomId === 'string' &&
      typeof (parsed as Session).name === 'string'
    ) {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}
