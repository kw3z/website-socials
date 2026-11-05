const ANILIST_USER = 'Quesz';
const GITHUB_USER = 'kw3z';
const number = new Intl.NumberFormat();

interface AniListStats {
  anime: string;
  episodes: string;
  watched: string;
  planned: string;
  chapters: string;
  current: string;
}

function setText(root: ParentNode, selector: string, value: string) {
  const node = root.querySelector<HTMLElement>(selector);
  if (node) node.textContent = value;
}

function showError(root: HTMLElement, message: string) {
  const state = root.querySelector<HTMLElement>('[data-stats-state]');
  if (state) {
    state.textContent = message;
    state.classList.add('error');
  }
}

function revealStats(root: HTMLElement) {
  const state = root.querySelector<HTMLElement>('[data-stats-state]');
  const grid = root.querySelector<HTMLElement>('.stat-grid, .github-numbers');
  if (state) state.hidden = true;
  if (grid) grid.hidden = false;
}

async function loadAniList(root: HTMLElement, retry = 0) {
  const render = (stats: AniListStats) => {
    setText(root, '[data-stat="anime"]', stats.anime);
    setText(root, '[data-stat="episodes"]', stats.episodes);
    setText(root, '[data-stat="watched"]', stats.watched);
    setText(root, '[data-stat="planned"]', stats.planned);
    setText(root, '[data-stat="chapters"]', stats.chapters);
    setText(root, '[data-stat="current"]', stats.current);
    revealStats(root);
  };

  const query = `
    query ($name: String) {
      User(name: $name) {
        statistics {
          anime { count episodesWatched minutesWatched statuses { status count } }
          manga { chaptersRead }
        }
      }
      MediaListCollection(userName: $name, type: ANIME, status: PLANNING) {
        lists {
          entries {
            progress
            media { episodes duration }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { name: ANILIST_USER } }),
    });
    if (!response.ok) throw new Error(`AniList returned ${response.status}.`);
    const payload = await response.json();
    const user = payload?.data?.User;
    if (!user) throw new Error(payload?.errors?.[0]?.message ?? 'AniList profile data is unavailable.');

    const anime = user.statistics.anime;
    const manga = user.statistics.manga;
    const lists = payload.data.MediaListCollection?.lists ?? [];
    const current = anime.statuses?.find((item: any) => item.status === 'CURRENT')?.count ?? 0;
    const plannedEntries = lists.flatMap((list: any) => list.entries ?? []);
    const plannedMinutes = plannedEntries.reduce((sum: number, entry: any) => {
      const episodes = entry.media?.episodes;
      const duration = entry.media?.duration;
      if (!episodes || !duration) return sum;
      return sum + Math.max(episodes - (entry.progress ?? 0), 0) * duration;
    }, 0);

    const stats: AniListStats = {
      anime: number.format(anime.count ?? 0),
      episodes: number.format(anime.episodesWatched ?? 0),
      watched: number.format(Math.round((anime.minutesWatched ?? 0) / 60)),
      planned: number.format(Math.round(plannedMinutes / 60)),
      chapters: number.format(manga.chaptersRead ?? 0),
      current: number.format(current),
    };
    render(stats);
  } catch (error) {
    console.warn('[stats] AniList request failed:', error);
    const status = root.querySelector<HTMLElement>('[data-stats-state]');
    if (retry < 2) {
      if (status) {
        status.textContent = 'AniList is unavailable · retrying…';
        status.hidden = false;
        status.classList.remove('error');
      }
      window.setTimeout(() => void loadAniList(root, retry + 1), 12_000);
      return;
    }
    const message = error instanceof Error && error.message.includes('429')
      ? 'AniList is rate-limited right now. Try again shortly.'
      : 'AniList is temporarily unavailable. Open the profile to see the latest.';
    showError(root, message);
  }
}

async function loadGitHub(root: HTMLElement) {
  try {
    const headers = { Accept: 'application/vnd.github+json' };
    const [userResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers }),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, { headers }),
    ]);
    if (!userResponse.ok || !reposResponse.ok) throw new Error('GitHub profile request failed.');
    const [user, repos] = await Promise.all([userResponse.json(), reposResponse.json()]);
    const stars = (repos as Array<{ stargazers_count?: number }>).reduce((total, repo) => total + (repo.stargazers_count ?? 0), 0);
    setText(root, '[data-github="repos"]', number.format(user.public_repos ?? 0));
    setText(root, '[data-github="stars"]', number.format(stars));
    setText(root, '[data-github="followers"]', number.format(user.followers ?? 0));
    revealStats(root);
  } catch {
    showError(root, 'GitHub stats could not load. Open the profile to see the latest.');
  }
}

document.querySelectorAll<HTMLElement>('[data-anilist-stats]').forEach((root) => void loadAniList(root));
document.querySelectorAll<HTMLElement>('[data-github-stats]').forEach((root) => void loadGitHub(root));
