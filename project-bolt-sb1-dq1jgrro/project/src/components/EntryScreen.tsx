import { useState, type FormEvent } from 'react';
import { Moon, Users, LogIn } from 'lucide-react';
import type { Session } from '@/lib/session';

const ROOM_PATTERN = /^[^,.()"'\\:]{1,40}$/;

interface Props {
  onEnter: (session: Session) => void;
}

export default function EntryScreen({ onEnter }: Props) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const r = roomId.trim();
    if (!n || n.length > 20) return setMessage('名前は1〜20文字で入力してください。');
    if (!ROOM_PATTERN.test(r)) return setMessage('部屋名は1〜40文字で、, . ( ) " \' \\ : は使えません。');
    setMessage(null);
    onEnter({ roomId: r, name: n });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <img
        src="https://images.pexels.com/photos/10685030/pexels-photo-10685030.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
        alt=""
        className="absolute inset-0 h-full w-full animate-ken-burns object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-night-950/40 via-night-950/70 to-night-950" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <Moon className="mx-auto mb-4 h-12 w-12 animate-float text-gold-300 drop-shadow-[0_0_18px_rgba(245,207,107,0.6)]" />
          <h1 className="font-serif text-5xl font-bold tracking-[0.3em] text-gold-100">人狼</h1>
          <p className="mt-3 text-sm text-night-200">月夜の村に潜む人狼を見つけ出せ</p>
        </div>

        <form onSubmit={submit} className="glass space-y-5 p-7">
          <label className="block space-y-1.5">
            <span className="text-sm text-night-200">名前</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="村人の名前" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-night-200">部屋名(合言葉)</span>
            <input className="field" value={roomId} onChange={(e) => setRoomId(e.target.value)} maxLength={40} placeholder="仲間と同じ名前を入力" />
          </label>
          {message && <p className="animate-shake text-sm text-rose-300">{message}</p>}
          <button type="submit" className="btn-primary w-full py-3 text-base">
            <LogIn className="h-4 w-4" /> 入室する
          </button>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-night-300">
            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            存在しない部屋名を入力すると、あなたが進行役(ホスト)の新しい部屋が作られます。
          </p>
        </form>
      </div>
    </div>
  );
}
