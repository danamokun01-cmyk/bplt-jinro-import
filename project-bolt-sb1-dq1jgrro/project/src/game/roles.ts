import { PawPrint, Eye, Ghost, Laugh, Trees, ShieldCheck, Crosshair, Hammer, Sparkles, Wand2, Moon, UserX, Cat, BadgeCheck, Crown, Fish, Search, Dog, Handshake, Coins, Flame, Skull, CloudRain, FlaskConical, Scroll, Zap, Heart, Gem, Swords, Snowflake, Croissant, Target, Dices, Shuffle, Star, Bug, Wheat, type LucideIcon } from 'lucide-react';

export type Team = '人間' | '人狼陣営' | '第三陣営' | '妖狐陣営' | '付与能力';

export interface RoleDef {
  label: string;
  team: Team;
  desc: string;
  icon: LucideIcon;
}

export const ROLES = {
  villager: { label: '村人', team: '人間', desc: '能力なし。推理と議論で人狼を探す', icon: Wheat },
  werewolf: { label: '人狼', team: '人狼陣営', desc: '夜に襲撃先へ投票(初日夜は襲撃なし)。仲間が分かる', icon: PawPrint },
  seer: { label: '占い師', team: '人間', desc: '夜に1人を占い、人狼か人間か分かる。妖狐を占うと呪殺', icon: Eye },
  medium: { label: '霊能者', team: '人間', desc: '朝に前日の処刑者が人狼だったか分かる', icon: Ghost },
  hunter: { label: '狩人', team: '人間', desc: '夜に1人を護衛(自分以外)。襲撃から守る', icon: Trees },
  mason: { label: '共有者', team: '人間', desc: '共有者同士が互いに分かる', icon: Hammer },
  madman: { label: '狂人', team: '人狼陣営', desc: '人間扱いだが人狼の勝利を目指す。占いは人間', icon: Laugh },
  fox: { label: '妖狐', team: '妖狐陣営', desc: '襲撃されない。占われると死亡。最後まで生き残れば勝利', icon: Sparkles },
  betrayer: { label: '背徳者', team: '妖狐陣営', desc: '妖狐の勝利を目指す。妖狐が全滅すると後追い死', icon: UserX },
  cat: { label: '猫又', team: '人間', desc: '襲撃・処刑で死ぬと、生存者1人を道連れにする', icon: Cat },
  sheriff: { label: 'シェリフ', team: '人間', desc: '2日目以降、毎晩1人を撃てる。人狼・ジャッカル・妖狐系なら倒せるが、それ以外を撃つと自分が死ぬ', icon: BadgeCheck },
  mayor: { label: 'メイヤー', team: '人間', desc: '投票が2票分としてカウントされる', icon: Crown },
  bait: { label: 'ベイト', team: '人間', desc: '人狼に襲撃されて死ぬと、襲撃した人狼の1人の名前が全員に公開される', icon: Fish },
  tracker: { label: 'トラッカー', team: '人間', desc: '夜に1人を追跡し、その人が夜に誰を対象に行動したか分かる', icon: Search },
  jackal: { label: 'ジャッカル', team: '第三陣営', desc: '2日目以降の夜に1人を襲撃、または1度だけ勧誘してサイドキックにできる。占いは人間。最後の勝者を目指す', icon: Dog },
  sidekick: { label: 'サイドキック', team: '第三陣営', desc: 'ジャッカルの仲間。ジャッカルが死ぬと新ジャッカルになる', icon: Handshake },
  opportunist: { label: 'オポチュニスト', team: '第三陣営', desc: '最後まで生き残れば、どの陣営が勝っても追加で勝利', icon: Coins },
  arsonist: { label: 'アーソニスト', team: '第三陣営', desc: '夜に油を塗り、点火すると油を塗った全員が死ぬ。最後の1人なら単独勝利。生存中は村人陣営の勝利を阻む', icon: Flame },
  suicidal: { label: '自殺願望者', team: '第三陣営', desc: '夜に死亡すると単独勝利(処刑では勝てない)', icon: Skull },
  sniper: { label: '狙撃手', team: '人間', desc: '2日目以降の夜に1度だけ1人を狙撃して殺害できる(護衛・妖狐にも有効)', icon: Crosshair },
  poisoner: { label: '毒人', team: '人間', desc: '処刑されると、自分に投票した人のうち1人をランダムに道連れにする', icon: FlaskConical },
  gravekeeper: { label: '墓守', team: '人間', desc: '毎朝、昨夜の死者の役職が分かる(処刑者は分からない)', icon: Scroll },
  cursed: { label: '呪われた者', team: '人間', desc: '人狼に襲撃されても死なず、人狼に覚醒する。それまでは村人陣営', icon: Zap },
  sorcerer: { label: '呪術師', team: '人狼陣営', desc: '夜に1人を選び占い師かどうか調べる。人間扱いで占いも人間', icon: Wand2 },
  teruteru: { label: 'てるてる', team: '第三陣営', desc: '処刑されると単独勝利(ゲーム即終了)。占いでは人間と判定される', icon: CloudRain },
  kogitsune: { label: '子狐', team: '妖狐陣営', desc: '占われても呪殺されないが、襲撃では死ぬ。妖狐が誰か分かる。占いは人間', icon: Moon },
  lover: { label: '恋人', team: '人間', desc: '2人1組。相手が分かり、片方が死ぬともう片方も後追い死する', icon: Heart },
  thief: { label: '怪盗', team: '人間', desc: '1夜目に1人を選び役職を入れ替える(夜明けに成立)。相手は怪盗になる', icon: Gem },
  knight: { label: '騎士', team: '人間', desc: '人狼に襲撃されても1度だけ鎧で耐える(自動発動)', icon: ShieldCheck },
  fanatic: { label: '狂信者', team: '人狼陣営', desc: '人狼が誰か知っている。人間扱いで占いも人間', icon: Swords },
  bigwolf: { label: '大狼', team: '人狼陣営', desc: '人狼の仲間。占い・霊能では「人間」と判定される', icon: Snowflake },
  baker: { label: 'パン屋', team: '人間', desc: '生存中は毎朝パンが焼ける。死ぬと焼けなくなり死亡が分かる', icon: Croissant },
  niceguesser: { label: 'ナイスゲッサー', team: '人間', desc: '昼・投票中に1人を指名して役職を言い当てると、その人が死亡。外すと自分が死亡(1回だけ)', icon: Target },
  evilguesser: { label: 'イビルゲッサー', team: '人狼陣営', desc: '人狼の仲間で夜の襲撃にも参加。ゲッサー能力で1回だけ役職を当てて殺害できるが、外すと自分が死亡。占い・霊能では「人狼」', icon: Dices },
  modguesser: { label: 'モディファイアゲッサー', team: '付与能力', desc: '他の役職にゲッサー能力が上乗せされる(役職の人数とは別枠で、人数分ランダムな人に付与)。1回だけ役職を当てて殺害でき、外すと自分が死亡', icon: Shuffle },
  star: { label: 'スター', team: '人間', desc: '能力はないが、ゲーム開始時に正体が全員に公開される。村の旗印', icon: Star },
  evilcat: { label: 'イビル猫又', team: '人狼陣営', desc: '人狼の仲間で夜の襲撃にも参加。襲撃・処刑で死ぬと、人狼以外の生存者1人を道連れにする。占い・霊能では「人狼」', icon: Cat },
  wolfpossessed: { label: '狼憑き', team: '人間', desc: '村人陣営だが、占い・霊能では「人狼」と判定されてしまう', icon: Bug },
} satisfies Record<string, RoleDef>;

export type RoleKey = keyof typeof ROLES;

export const ROLE_KEYS = Object.keys(ROLES) as RoleKey[];

export const TEAM_STYLE: Record<Team, { ring: string; glow: string; chip: string }> = {
  人間: { ring: 'from-sky-400 to-cyan-600', glow: 'shadow-sky-500/40', chip: 'bg-sky-500/20 text-sky-200 border-sky-400/40' },
  人狼陣営: { ring: 'from-rose-500 to-red-800', glow: 'shadow-rose-500/50', chip: 'bg-rose-500/20 text-rose-200 border-rose-400/40' },
  第三陣営: { ring: 'from-amber-400 to-orange-700', glow: 'shadow-amber-400/40', chip: 'bg-amber-500/20 text-amber-200 border-amber-400/40' },
  妖狐陣営: { ring: 'from-teal-300 to-emerald-700', glow: 'shadow-teal-400/40', chip: 'bg-teal-500/20 text-teal-200 border-teal-400/40' },
  付与能力: { ring: 'from-zinc-300 to-zinc-600', glow: 'shadow-zinc-300/30', chip: 'bg-zinc-500/20 text-zinc-200 border-zinc-400/40' },
};

export function isRoleKey(value: string): value is RoleKey {
  return Object.prototype.hasOwnProperty.call(ROLES, value);
}
