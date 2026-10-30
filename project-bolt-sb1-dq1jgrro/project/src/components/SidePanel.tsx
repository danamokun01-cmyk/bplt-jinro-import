import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessagesSquare, ScrollText, Send } from 'lucide-react';
import type { ChatChannel, ChatMessage, GameState } from '@/game/types';
import { canSeeChannel, chatChannelsFor, findPlayer } from '@/game/state';

interface Props {
  game: GameState;
  meId: string;
  chats: ChatMessage[];
  onSend: (channel: ChatChannel, text: string) => Promise<void>;
}

const CHANNEL_STYLE: Record<ChatChannel, string> = {
  all: 'text-night-50',
  wolf: 'text-rose-300',
  mason: 'text-sky-300',
  dead: 'text-night-300',
};

export default function SidePanel({ game, meId, chats, onSend }: Props) {
  const me = findPlayer(game, meId);
  const options = chatChannelsFor(me);
  const [channel, setChannel] = useState<string>('all');
  const [text, setText] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const visible = chats.filter((c) => canSeeChannel(game, me, c.channel));

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible.length]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (t.length > 300) return setHint('メッセージは300文字以内にしてください。');
    if (channel === 'all' && me?.alive && game.phase === 'night') return setHint('夜は全体チャットできません。');
    setHint(null);
    setText('');
    await onSend(channel as ChatChannel, t);
  };

  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <section className="glass p-4">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-gold-100">
          <ScrollText className="h-4 w-4" /> ログ
        </h2>
        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1 text-sm">
          {[...game.log].reverse().map((line, i) => (
            <li key={`${game.log.length - i}`} className={line.startsWith('---') ? 'text-gold-300' : line.startsWith('★') ? 'font-medium text-gold-100' : 'text-night-200'}>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass flex flex-col p-4">
        <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-gold-100">
          <MessagesSquare className="h-4 w-4" /> チャット
        </h2>
        <div ref={listRef} className="mb-3 h-56 space-y-1.5 overflow-y-auto pr-1 text-sm">
          {visible.map((c) => (
            <p key={c.id} className={`animate-fade-up break-words ${CHANNEL_STYLE[c.channel]}`}>
              <span className="font-medium">{c.name}</span>
              {c.channel !== 'all' && <span className="ml-1 text-xs opacity-70">[{options.find((o) => o.value === c.channel)?.label ?? c.channel}]</span>}
              <span className="text-night-300">: </span>
              {c.text}
            </p>
          ))}
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="field w-24 shrink-0 px-2">
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} className="field min-w-0" placeholder="発言する" />
          <button type="submit" className="btn-primary px-3" aria-label="送信">
            <Send className="h-4 w-4" />
          </button>
        </form>
        {hint && <p className="mt-2 text-xs text-rose-300">{hint}</p>}
      </section>
    </aside>
  );
}
