import { linkSchema, type SocialEntry } from './schema';

// Add a new link = append ONE object below. Order within a group = array order.
const entries: SocialEntry[] = [
  // ---- Social ----
  { id: 'anilist', kind: 'link', platform: 'AniList', icon: 'anilist', group: 'social',
    href: 'https://anilist.co/user/Quesz/', display: 'anilist.co/user/Quesz' },
  { id: 'instagram', kind: 'link', platform: 'Instagram', icon: 'instagram', group: 'social',
    href: 'https://www.instagram.com/queszz_/', display: 'instagram.com/queszz_' },
  { id: 'youtube', kind: 'link', platform: 'YouTube', icon: 'youtube', group: 'social',
    href: 'https://www.youtube.com/@kw3sz', display: 'youtube.com/@kw3sz' },
  { id: 'spotify', kind: 'link', platform: 'Spotify', icon: 'spotify', group: 'social',
    href: 'https://open.spotify.com/user/4diwpv251hrzy9bhwyi7ru1wx', display: 'open.spotify.com' },

  // ---- Gaming ----
  { id: 'steam', kind: 'link', platform: 'Steam', icon: 'steam', group: 'gaming',
    href: 'https://steamcommunity.com/id/kw3sz/', display: 'steamcommunity.com/id/kw3sz' },
  { id: 'discord', kind: 'link', platform: 'Discord', icon: 'discord', group: 'gaming',
    href: 'https://discord.com/users/quesz', display: 'quesz', copy: 'quesz' },
  { id: 'riot', kind: 'handle', platform: 'Riot Games', icon: 'riotgames', group: 'gaming',
    label: 'Riot ID', value: 'Quesz#Baka' },
  { id: 'fluxer', kind: 'handle', platform: 'Fluxer', icon: 'fluxer', group: 'gaming',
    label: 'Fluxer tag', value: 'Quesz#1180' },

  // ---- Dev & contact ----
  { id: 'github', kind: 'link', platform: 'GitHub', icon: 'github', group: 'dev',
    href: 'https://github.com/kw3z', display: 'github.com/kw3z' },
  { id: 'email', kind: 'email', platform: 'Email', icon: 'mail', group: 'dev',
    address: 'quesz.web@gmail.com' },
];

// Validated at build time: invalid data fails the build.
export const links = entries.map((e) => linkSchema.parse(e));
const ids = links.map((l) => l.id);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate link id in links.ts');

export const groups = [
  { id: 'social', label: 'Social' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'dev', label: 'Dev & contact' },
] as const;
