import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ActionRow, ActionType, ChatChannel, ChatMessage, GameState, Timers } from '@/game/types';
import { applyAction } from '@/game/actions';
import { forceAdvance, toVote } from '@/game/vote';
import { type RoleCounts, DEFAULT_TIMERS, createRoomState, resetGame, startGame } from '@/game/setup';
import { addLog, emptyNight } from '@/game/state';

interface Me {
  id: string;
  name: string;
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as GameState;
  return Array.isArray(s.players) && Array.isArray(s.log) && typeof s.phase === 'string';
}

function normalize(S: GameState): GameState {
  return { ...S, night: S.night ?? emptyNight(), votes: S.votes ?? {}, priv: S.priv ?? {}, T: S.T ?? { ...DEFAULT_TIMERS } };
}

export function useGameRoom(roomId: string, me: Me) {
  const [game, setGame] = useState<GameState | null>(null);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const gameRef = useRef<GameState | null>(null);
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const autoPendingRef = useRef(false);

  const flashNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((cur) => (cur === message ? null : cur)), 3000);
  }, []);

  const runQueued = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = queueRef.current.then(task);
    queueRef.current = next.catch((e: unknown) => console.error(e));
    return next;
  }, []);

  const persist = useCallback(
    async (S: GameState) => {
      const { error: e } = await supabase
        .from('rooms')
        .update({ state: S, updated_at: new Date().toISOString() })
        .eq('id', roomId);
      if (e) flashNotice('保存に失敗しました。通信状況を確認してください。');
    },
    [roomId, flashNotice]
  );

  const commit = useCallback(
    async (S: GameState) => {
      gameRef.current = S;
      setGame({ ...S });
      await persist(S);
    },
    [persist]
  );

  useEffect(() => {
    let cancelled = false;
    const channel = supabase
      .channel('room-' + roomId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const next = (payload.new as { state?: unknown }).state;
          if (gameRef.current?.host === me.id || !isGameState(next)) return;
          gameRef.current = normalize(next);
          setGame(normalize(next));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'actions', filter: `room=eq.${roomId}` },
        (payload) => {
          const row = payload.new as ActionRow;
          if (gameRef.current?.host !== me.id) return;
          runQueued(async () => {
            const S = gameRef.current;
            if (!S) return;
            applyAction(S, row);
            await commit(S);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat', filter: `room=eq.${roomId}` },
        (payload) => {
          const row = payload.new as ChatMessage;
          setChats((prev) => [...prev, row]);
        }
      )
      .subscribe();

    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('rooms')
        .select('state')
        .eq('id', roomId)
        .maybeSingle();
      if (cancelled) return;
      if (loadError) {
        setError('部屋の読み込みに失敗しました。時間をおいて再度お試しください。');
        return;
      }

      let S: GameState;
      if (!data) {
        S = createRoomState(me.id, me.name);
        const { error: insertError } = await supabase.from('rooms').insert({ id: roomId, state: S });
        if (cancelled) return;
        if (insertError) {
          setError('部屋の作成に失敗しました。別の部屋名でお試しください。');
          return;
        }
      } else if (isGameState(data.state)) {
        S = normalize(data.state);
      } else {
        setError('部屋のデータが正しくありません。');
        return;
      }

      gameRef.current = S;
      setGame(S);

      const { data: history, error: chatError } = await supabase
        .from('chat')
        .select('id, pid, name, channel, text')
        .eq('room', roomId)
        .order('id', { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (chatError) flashNotice('チャットの履歴を読み込めませんでした。');
      const past = ((history ?? []) as ChatMessage[]).reverse();
      setChats((prev) => {
        const seen = new Set(past.map((m) => m.id));
        return [...past, ...prev.filter((m) => !seen.has(m.id))];
      });

      if (!S.players.some((p) => p.id === me.id) && S.phase === 'lobby') {
        await supabase.from('actions').insert({ room: roomId, pid: me.id, type: 'join', target: me.name });
      }
    };

    load();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId, me.id, me.name, commit, runQueued, flashNotice]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      const S = gameRef.current;
      if (!S || S.host !== me.id || !S.deadline || current <= S.deadline || autoPendingRef.current) return;
      autoPendingRef.current = true;
      runQueued(async () => {
        const cur = gameRef.current;
        if (cur && cur.deadline && Date.now() > cur.deadline) {
          if (cur.phase === 'night' || cur.phase === 'vote') {
            addLog(cur, '(時間切れで自動進行)');
            forceAdvance(cur);
          } else if (cur.phase === 'day') {
            addLog(cur, '(時間切れで自動進行)');
            toVote(cur);
          }
          await commit(cur);
        }
      }).finally(() => {
        autoPendingRef.current = false;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [me.id, commit, runQueued]);

  const sendAction = useCallback(
    async (type: ActionType, target: string | null = null) => {
      const { error: e } = await supabase
        .from('actions')
        .insert({ room: roomId, pid: me.id, type, target });
      if (e) flashNotice('行動を送信できませんでした。');
    },
    [roomId, me.id, flashNotice]
  );

  const sendChat = useCallback(
    async (channel: ChatChannel, text: string) => {
      const { error: e } = await supabase
        .from('chat')
        .insert({ room: roomId, pid: me.id, name: me.name, channel, text });
      if (e) flashNotice('メッセージを送信できませんでした。');
    },
    [roomId, me.id, me.name, flashNotice]
  );

  const hostStart = useCallback(
    (counts: RoleCounts, timers: Timers) =>
      runQueued(async () => {
        const S = gameRef.current;
        if (!S) return '部屋が読み込まれていません';
        const err = startGame(S, counts, timers);
        if (!err) await commit(S);
        return err;
      }),
    [runQueued, commit]
  );

  const hostToVote = useCallback(
    () =>
      runQueued(async () => {
        const S = gameRef.current;
        if (!S) return;
        toVote(S);
        await commit(S);
      }),
    [runQueued, commit]
  );

  const hostForce = useCallback(
    () =>
      runQueued(async () => {
        const S = gameRef.current;
        if (!S) return;
        forceAdvance(S);
        await commit(S);
      }),
    [runQueued, commit]
  );

  const hostReset = useCallback(
    () =>
      runQueued(async () => {
        const S = gameRef.current;
        if (!S) return;
        resetGame(S);
        await commit(S);
      }),
    [runQueued, commit]
  );

  return {
    game,
    chats,
    now,
    error,
    notice,
    isHost: game?.host === me.id,
    loading: game === null && error === null,
    sendAction,
    sendChat,
    hostStart,
    hostToVote,
    hostForce,
    hostReset,
  };
}
