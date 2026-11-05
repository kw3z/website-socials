import { projectSchema, type Project } from './schema';

const entries: Project[] = [
  {
    id: 'tmtbl', title: 'TMTBL', variant: 'lead', status: 'live', featured: true, logo: 'tmtbl',
    description:
      'A smart, all-in-one productivity app to manage daily tasks, school schedules, and homework, featuring custom notifications, progress tracking, and personalized themes.',
    tags: ['Productivity', 'Web app'],
    links: [
      { label: 'Live build', href: 'https://tmtbl.vercel.app/', kind: 'live' },
      { label: 'Repo', href: 'https://github.com/kw3z/TMTBL', kind: 'repo' },
    ],
  },
  {
    id: 'cursors', title: 'My Cursor Pack', variant: 'standard', status: 'live', featured: false,
    description: 'A black cursor set with rounded shapes.', // TODO: confirm wording
    tags: ['Cursors'],
    links: [{ label: 'Repo', href: 'https://github.com/kw3z/blackplusRoundcursors', kind: 'repo' }],
  },
  {
    id: 'hyprland', title: 'My Hyprland Dotfiles', variant: 'standard', status: 'live', featured: false,
    description: 'My Hyprland desktop configuration.', // TODO: confirm wording
    tags: ['Linux', 'Dotfiles'],
    links: [{ label: 'Repo', href: 'https://github.com/kw3z/hyprland-dots', kind: 'repo' }],
  },
  {
    id: 'orbit', title: 'Orbit', variant: 'upcoming', status: 'soon', featured: false, logo: 'orbit',
    description:
      'Syncs with your AniList, spins up what to watch next, and keeps every episode note in one calm place.',
    tags: ['AniList', 'Anime'],
    links: [{ label: 'Preview site', href: 'https://get-orbit.pages.dev', kind: 'site' }],
  },
];

export const projects = entries.map((p) => projectSchema.parse(p));
