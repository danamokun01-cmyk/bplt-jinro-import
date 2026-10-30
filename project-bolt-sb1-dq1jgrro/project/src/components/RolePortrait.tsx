import { HelpCircle } from 'lucide-react';
import { ROLES, TEAM_STYLE, type RoleKey } from '@/game/roles';

interface Props {
  role?: RoleKey;
  size?: 'sm' | 'md' | 'lg';
  hidden?: boolean;
  className?: string;
}

const SIZE = {
  sm: { box: 'w-14 h-14', icon: 'h-6 w-6', text: 'text-[10px]' },
  md: { box: 'w-24 h-24', icon: 'h-10 w-10', text: 'text-xs' },
  lg: { box: 'w-40 h-52', icon: 'h-16 w-16', text: 'text-sm' },
};

export default function RolePortrait({ role, size = 'md', hidden = false, className = '' }: Props) {
  const s = SIZE[size];
  if (hidden || !role) {
    return (
      <div className={`${s.box} ${className} relative flex items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-night-700 to-night-900 shadow-lg`}>
        <HelpCircle className={`${s.icon} text-night-300`} />
      </div>
    );
  }
  const def = ROLES[role];
  const style = TEAM_STYLE[def.team];
  const Icon = def.icon;
  return (
    <div
      className={`${s.box} ${className} group relative flex animate-card-flip flex-col items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${style.ring} p-[2px] shadow-xl ${style.glow} transition duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_60%)]" />
      <div className="relative flex h-full w-full flex-col items-center justify-between rounded-[14px] bg-night-950/85 px-2 py-3">
        <div className="flex flex-1 items-center justify-center">
          <div className="flex h-2/3 aspect-square items-center justify-center rounded-full bg-white/5 ring-1 ring-white/20 transition duration-500 group-hover:scale-110 group-hover:rotate-6">
            <Icon className={`${s.icon} text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.45)] animate-float`} strokeWidth={1.6} />
          </div>
        </div>
        <span className={`${s.text} font-medium tracking-wide text-night-50`}>{def.label}</span>
      </div>
    </div>
  );
}
