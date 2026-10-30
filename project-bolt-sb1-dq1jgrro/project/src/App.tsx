import { useState } from 'react';
import { loadSession, saveSession, type Session } from '@/lib/session';
import EntryScreen from '@/components/EntryScreen';
import GameRoom from '@/components/GameRoom';

function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  const enter = (next: Session) => {
    saveSession(next);
    setSession(next);
  };

  const leave = () => {
    saveSession(null);
    setSession(null);
  };

  if (!session) return <EntryScreen onEnter={enter} />;
  return <GameRoom key={session.roomId} roomId={session.roomId} name={session.name} onLeave={leave} />;
}

export default App;
