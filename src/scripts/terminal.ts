export {};

type TerminalLink = { id: string; group: string; platform: string; kind: string; label: string; hint: string; href: string };
type TerminalProject = { title: string; description: string; links: { label: string; href: string }[] };
type TerminalData = { profile: { name: string; handle: string; bio: string }; avatar: string; links: TerminalLink[]; projects: TerminalProject[] };

const root = document.documentElement;
const output = document.querySelector<HTMLDivElement>('#terminal-output');
const form = document.querySelector<HTMLFormElement>('#terminal-form');
const input = document.querySelector<HTMLInputElement>('#terminal-input');
const dataElement = document.querySelector<HTMLScriptElement>('#terminal-data');

if (output && form && input && dataElement) {
  const terminalOutput = output;
  const terminalForm = form;
  const terminalInput = input;
  const data = JSON.parse(dataElement.textContent ?? '{}') as TerminalData;
  let booted = false;

  const scrollToEnd = () => {
    const screen = terminalOutput.closest<HTMLElement>('.terminal-screen');
    if (screen) screen.scrollTop = screen.scrollHeight;
  };

  function line(text: string, className = '') {
    const p = document.createElement('p');
    p.className = `term-line ${className}`.trim();
    p.textContent = text;
    terminalOutput.append(p);
    scrollToEnd();
  }

  function linkLine(label: string, href: string, hint = '') {
    const row = document.createElement('p');
    row.className = 'term-line';
    const anchor = document.createElement('a');
    anchor.className = 'term-link';
    anchor.href = href;
    anchor.textContent = label;
    if (!href.startsWith('mailto:')) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
    row.append(anchor);
    if (hint) row.append(document.createTextNode(`  ·  ${hint}`));
    terminalOutput.append(row);
    scrollToEnd();
  }

  function entriesFor(group: string) {
    const entries = data.links.filter((entry) => group === 'all' || entry.group === group);
    if (!entries.length) { line(`No entries found for ${group}.`, 'term-dim'); return; }
    entries.forEach((entry) => {
      const label = `${entry.platform}: ${entry.label}`;
      if (entry.href) linkLine(label, entry.href, entry.hint);
      else line(`${label}${entry.hint ? `  ·  ${entry.hint}` : ''}`);
    });
  }

  function showProjects() {
    data.projects.forEach((project) => {
      const row = document.createElement('div');
      row.className = 'term-entry';
      const title = document.createElement('p');
      title.className = 'term-line term-accent';
      title.textContent = project.title;
      const description = document.createElement('small');
      description.textContent = project.description;
      row.append(title, description);
      project.links.forEach((item) => {
        const a = document.createElement('a');
        a.className = 'term-link';
        a.href = item.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = `[${item.label}]`;
        row.append(a);
      });
      terminalOutput.append(row);
    });
    scrollToEnd();
  }

  function showProfile() {
    const intro = document.createElement('div');
    intro.className = 'term-intro';
    const image = document.createElement('img');
    image.className = 'term-avatar';
    image.src = data.avatar;
    image.alt = `${data.profile.name} profile icon`;
    const words = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'term-name';
    name.textContent = `${data.profile.name} @${data.profile.handle}`;
    const bio = document.createElement('p');
    bio.textContent = data.profile.bio;
    words.append(name, bio);
    intro.append(image, words);
    terminalOutput.append(intro);
    scrollToEnd();
  }

  function execute(raw: string) {
    const command = raw.trim();
    if (!command) return;
    line(`guest@quesz:~$ ${command}`, 'term-accent');
    const [verb = '', ...args] = command.toLowerCase().split(/\s+/);
    const target = args.join(' ');
    switch (verb) {
      case 'help':
      case 'ls':
        line('Available commands:');
        line('  help        — show this list');
        line('  socials     — show social profiles');
        line('  gaming      — show gaming accounts');
        line('  dev         — show developer and contact links');
        line('  projects    — show things I have made');
        line('  about       — show the profile tagline');
        line('  open <name> — open a link (try: open github)');
        line('  clear       — clear the screen');
        line('  exit        — return to the regular site');
        break;
      case 'socials':
      case 'links':
        entriesFor('social');
        break;
      case 'gaming':
        entriesFor('gaming');
        break;
      case 'dev':
      case 'contact':
        entriesFor('dev');
        break;
      case 'projects':
        showProjects();
        break;
      case 'about':
        showProfile();
        break;
      case 'open': {
        const match = data.links.find((entry) => [entry.id, entry.platform, entry.label].some((value) => value.toLowerCase() === target));
        const project = data.projects.find((item) => item.title.toLowerCase() === target);
        const projectLink = project?.links[0];
        const href = match?.href || projectLink?.href;
        const label = match ? `${match.platform}: ${match.label}` : project && projectLink ? `${project.title} · ${projectLink.label}` : '';
        if (href) {
          line(`Opening ${label}…`, 'term-dim');
          window.open(href, '_blank', 'noopener,noreferrer');
          linkLine(label, href, match?.hint);
        } else if (match) line(`${match.platform}: ${match.label}${match.hint ? ` · ${match.hint}` : ''}`);
        else line(target ? `No link matched “${target}”. Try "open anilist", “open youtube”, or “open github”.` : 'Usage: open <name>', 'term-dim');
        break;
      }
      case 'clear':
        terminalOutput.replaceChildren();
        break;
      case 'exit':
        document.querySelector<HTMLButtonElement>(`[data-theme-choice="${window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'}"]`)?.click();
        break;
      default:
        line(`Command not found: ${verb}. Type “help” to see available commands.`, 'term-dim');
    }
    scrollToEnd();
  }

  async function boot() {
    if (booted) return;
    booted = true;
    terminalOutput.replaceChildren();
    terminalInput.disabled = true;
    showProfile();
    await new Promise((resolve) => window.setTimeout(resolve, 480));
    line('Profile loaded. Type “help” to explore.');
    terminalInput.disabled = false;
    terminalInput.focus();
  }

  terminalForm.addEventListener('submit', (event) => {
    event.preventDefault();
    execute(terminalInput.value);
    terminalInput.value = '';
    terminalInput.focus();
  });

  const observer = new MutationObserver(() => {
    if (root.dataset.mode === 'terminal') { void boot(); }
    else { booted = false; terminalInput.disabled = true; terminalOutput.replaceChildren(); }
  });
  observer.observe(root, { attributes: true, attributeFilter: ['data-mode'] });
  if (root.dataset.mode === 'terminal') void boot();
}
