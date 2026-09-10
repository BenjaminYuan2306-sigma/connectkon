import { emptyNetwork, canonicalUrl, type Network } from './network';
const KEY = 'connectkon.workspace.v1';
const str = (x: unknown) => typeof x === 'string';
const date = (x: unknown) =>
  str(x) &&
  (!x ||
    (/^\d{4}-\d{2}-\d{2}$/.test(x as string) &&
      !isNaN(Date.parse(x as string)) &&
      new Date((x as string) + 'T12:00:00Z').toISOString().slice(0, 10) === x));
const point = (p: any) => p && Number.isFinite(p.x) && Number.isFinite(p.y);
function uniqueId(id: unknown, ids: Set<string>) {
  if (!str(id) || !id || ids.has(id as string))
    throw Error('Missing or duplicate record ID.');
  ids.add(id as string);
}
export function validateNetwork(value: unknown): Network {
  const d = value as Network;
  if (
    !d ||
    d.version !== 1 ||
    !['people', 'conversations', 'relationships', 'texts'].every((k) =>
      Array.isArray((d as any)[k]),
    )
  )
    throw Error('This file is not a ConnectKon workspace.');
  const ids = new Set<string>(),
    people = new Set<string>(),
    urls = new Set<string>();
  for (const p of d.people) {
    if (!p || typeof p !== 'object') throw Error('Invalid connection.');
    uniqueId(p.id, ids);
    people.add(p.id);
    const u = canonicalUrl(p.linkedinUrl);
    if (
      ![
        'name',
        'linkedinUrl',
        'profileImage',
        'company',
        'role',
        'industry',
        'howWeMet',
        'reason',
        'nextConversation',
        'notes',
        'priority',
        'createdAt',
        'updatedAt',
      ].every((k) => str((p as any)[k])) ||
      !p.name.trim() ||
      !u ||
      urls.has(u) ||
      !Array.isArray(p.tags) ||
      !p.tags.every(str) ||
      !point(p.position) ||
      !Number.isInteger(p.strength) ||
      p.strength < 1 ||
      p.strength > 5 ||
      (p.sameUniversity !== undefined &&
        typeof p.sameUniversity !== 'boolean') ||
      !Number.isInteger(p.initialCount) ||
      p.initialCount < 0 ||
      !date(p.lastContact) ||
      !date(p.followUp)
    )
      throw Error(
        'Invalid or duplicate connection data. Check names, LinkedIn URLs, dates, and required fields.',
      );
    urls.add(u);
  }
  for (const c of d.conversations) {
    if (!c || typeof c !== 'object') throw Error('Invalid conversation.');
    uniqueId(c.id, ids);
    if (
      !people.has(c.connectionId) ||
      ![
        'summary',
        'takeaways',
        'privateNotes',
        'type',
        'createdAt',
        'updatedAt',
      ].every((k) => str((c as any)[k])) ||
      !c.date ||
      !date(c.date) ||
      !date(c.followUp) ||
      !Array.isArray(c.topics) ||
      !c.topics.every(str) ||
      !Array.isArray(c.actions)
    )
      throw Error('Invalid conversation data.');
    const actionIds = new Set<string>();
    for (const a of c.actions) {
      if (!a || !str(a.text) || typeof a.completed !== 'boolean')
        throw Error('Invalid action item.');
      uniqueId(a.id, actionIds);
    }
  }
  for (const e of d.relationships) {
    if (!e || typeof e !== 'object') throw Error('Invalid relationship.');
    uniqueId(e.id, ids);
    if (
      !people.has(e.source) ||
      !people.has(e.target) ||
      e.source === e.target ||
      !['type', 'label', 'notes'].every((k) => str((e as any)[k]))
    )
      throw Error('Invalid relationship data.');
  }
  for (const t of d.texts) {
    if (!t || typeof t !== 'object') throw Error('Invalid text node.');
    uniqueId(t.id, ids);
    if (
      !str(t.text) ||
      !point(t.position) ||
      !Number.isFinite(t.width) ||
      t.width < 1 ||
      !Number.isFinite(t.height) ||
      t.height < 1
    )
      throw Error('Invalid text node.');
  }
  if (
    !d.viewport ||
    !Number.isFinite(d.viewport.zoom) ||
    d.viewport.zoom < 0.15 ||
    d.viewport.zoom > 2 ||
    !point(d.viewport)
  )
    throw Error('Invalid canvas view.');
  return d;
}
export const repository = {
  load(): Network {
    const s = localStorage.getItem(KEY);
    return s ? validateNetwork(JSON.parse(s)) : emptyNetwork();
  },
  save(d: Network) {
    localStorage.setItem(KEY, JSON.stringify(d));
  },
  export(d: Network) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'connectkon-workspace.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
