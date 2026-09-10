import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

mkdirSync('work/analytics-tests', { recursive: true });
const compile = (source, name, replacements = {}) => {
  let code = ts.transpileModule(readFileSync(source, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  }).outputText;
  for (const [from, to] of Object.entries(replacements))
    code = code.replaceAll(from, to);
  writeFileSync(`work/analytics-tests/${name}.mjs`, code);
};
compile('lib/analytics-contract.ts', 'contract');
compile('lib/analytics-sql.ts', 'sql');
compile('lib/analytics-client.ts', 'client');
for (const route of ['event', 'summary'])
  compile(`app/api/analytics/${route}/route.ts`, route, {
    "'@/db'": "'./support.mjs'",
    "'@/lib/analytics-auth'": "'./support.mjs'",
    "'@/lib/analytics-contract'": "'./contract.mjs'",
    "'@/lib/analytics-sql'": "'./sql.mjs'",
  });
writeFileSync(
  'work/analytics-tests/support.mjs',
  `export const analyticsDb=()=>globalThis.testDb;export const analyticsAccess=async()=>globalThis.testAccess;`,
);
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync('drizzle/0000_stiff_maddog.sql', 'utf8'));
globalThis.testDb = {
  prepare(sql) {
    return {
      sql,
      params: [],
      bind(...params) {
        return { sql, params };
      },
    };
  },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const result = statements.map((s) => ({
        success: true,
        results: sqlite.prepare(s.sql).all(...s.params),
      }));
      sqlite.exec('COMMIT');
      return result;
    } catch (e) {
      sqlite.exec('ROLLBACK');
      throw e;
    }
  },
};
globalThis.testAccess = { signedIn: false, owner: false };
const { POST } = await import('./work/analytics-tests/event.mjs');
const { GET } = await import('./work/analytics-tests/summary.mjs');
const { analyticsDay, parseUsageInput } =
  await import('./work/analytics-tests/contract.mjs');
const now = Date.now(),
  today = analyticsDay(now),
  yesterday = analyticsDay(now - 86400_000);
const post = (data, extra = {}) =>
  POST(
    new Request('https://connectkon.test/api/analytics/event', {
      method: 'POST',
      headers: {
        origin: 'https://connectkon.test',
        'content-type': 'application/json',
        ...extra,
      },
      body: JSON.stringify(data),
    }),
  );
const event = (visitor = crypto.randomUUID(), name = 'visit') => ({
  id: crypto.randomUUID(),
  visitor,
  event: name,
});
const count = () =>
  sqlite.prepare('SELECT COUNT(*) AS n FROM usage_events').get().n;
const clear = () => sqlite.exec('DELETE FROM usage_events');
let checks = 0;
const check = async (name, fn) => {
  await fn();
  console.log('PASS ' + name);
  checks++;
};

await check(
  'Unauthorized and non-owner statistics requests fail closed',
  async () => {
    assert.equal((await GET()).status, 401);
    globalThis.testAccess = { signedIn: true, owner: false };
    assert.equal((await GET()).status, 403);
    globalThis.testAccess = { signedIn: false, owner: false };
  },
);
await check(
  'Only allowlisted events and anonymous identifiers are accepted',
  async () => {
    assert.throws(() =>
      parseUsageInput({ ...event(), notes: 'Private conversation' }),
    );
    assert.equal(
      (await post({ ...event(), event: 'contact_name' })).status,
      400,
    );
    assert.equal(
      (await post({ ...event(), visitor: 'someone@example.com' })).status,
      400,
    );
    assert.equal(count(), 0);
  },
);
await check(
  'Cross-origin, oversized and privacy-opted-out events are rejected',
  async () => {
    assert.equal(
      (await post(event(), { origin: 'https://other.test' })).status,
      403,
    );
    assert.equal((await post({ notes: 'x'.repeat(1200) })).status, 413);
    assert.equal((await post(event(), { dnt: '1' })).status, 204);
    assert.equal((await post(event(), { 'sec-gpc': '1' })).status, 204);
    assert.equal(count(), 0);
  },
);
await check('Logged-in owner activity is excluded', async () => {
  globalThis.testAccess = { signedIn: true, owner: true };
  assert.equal((await post(event())).status, 204);
  assert.equal(count(), 0);
  globalThis.testAccess = { signedIn: false, owner: false };
});
await check(
  'Event retries are idempotent and visitor identifiers are hashed',
  async () => {
    const e = event();
    assert.equal((await post(e)).status, 204);
    assert.equal((await post(e)).status, 204);
    assert.equal(count(), 1);
    assert.notEqual(
      sqlite.prepare('SELECT visitor FROM usage_events').get().visitor,
      e.visitor,
    );
    clear();
  },
);
await check(
  'Daily uniques, session counts and returning visitors use distinct definitions',
  async () => {
    const insert = sqlite.prepare(
      'INSERT INTO usage_events VALUES (?, ?, ?, ?, ?)',
    );
    for (const [v, name, day] of [
      ['A', 'visit', yesterday],
      ['A', 'visit', today],
      ['B', 'visit', today],
      ['B', 'visit', today],
      ['A', 'connection_created', today],
    ])
      insert.run(crypto.randomUUID(), v, name, day, now);
    globalThis.testAccess = { signedIn: true, owner: true };
    const r = await GET();
    assert.equal(r.status, 200);
    assert.match(r.headers.get('cache-control'), /no-store/);
    const d = await r.json();
    assert.equal(d.today, 2);
    assert.equal(d.visitors, 2);
    assert.equal(d.visits, 4);
    assert.equal(d.returning, 1);
    assert.equal(d.features[0].count, 1);
    assert.equal(d.daily.length, 2);
    globalThis.testAccess = { signedIn: false, owner: false };
    clear();
  },
);
await check('Events older than 90 days are pruned on collection', async () => {
  sqlite
    .prepare('INSERT INTO usage_events VALUES (?, ?, ?, ?, ?)')
    .run('old', 'old', 'visit', '2020-01-01', now - 91 * 86400_000);
  await post(event());
  assert.equal(count(), 1);
  assert.equal(
    sqlite.prepare("SELECT COUNT(*) n FROM usage_events WHERE id='old'").get()
      .n,
    0,
  );
  clear();
});
await check('Visitor daily cap limits repeated event writes', async () => {
  const e = event();
  await post(e);
  const v = sqlite.prepare('SELECT visitor FROM usage_events').get().visitor;
  const insert = sqlite.prepare(
    'INSERT INTO usage_events VALUES (?, ?, ?, ?, ?)',
  );
  for (let i = 1; i < 500; i++)
    insert.run(crypto.randomUUID(), v, 'visit', today, now);
  await post({ ...e, id: crypto.randomUUID() });
  assert.equal(count(), 500);
  clear();
});
await check('Bangkok midnight is the reporting date boundary', () => {
  assert.equal(analyticsDay(Date.parse('2026-09-08T16:59:59Z')), '2026-09-08');
  assert.equal(analyticsDay(Date.parse('2026-09-08T17:00:00Z')), '2026-09-09');
});

const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};
globalThis.window = {};
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
Object.defineProperty(globalThis, 'navigator', {
  value: { doNotTrack: '0' },
  configurable: true,
});
const sent = [];
globalThis.fetch = async (_, options) => {
  sent.push(JSON.parse(options.body));
  return new Response(null, { status: 204 });
};
const client = await import('./work/analytics-tests/client.mjs');
await check(
  'Client deduplicates visits while retaining feature actions',
  () => {
    client.trackUsage('visit');
    client.trackUsage('visit');
    client.trackUsage('connection_created');
    assert.equal(sent.filter((e) => e.event === 'visit').length, 1);
    assert.equal(
      sent.filter((e) => e.event === 'connection_created').length,
      1,
    );
    assert.ok(
      sent.every((e) => Object.keys(e).sort().join(',') === 'event,id,visitor'),
    );
  },
);
await check(
  'Disabling statistics and browser privacy controls stop events',
  () => {
    client.setUsageEnabled(false);
    const n = sent.length;
    client.trackUsage('visit');
    assert.equal(sent.length, n);
    assert.equal(localStorage.getItem('connectkon.usage.visitor'), null);
    navigator.doNotTrack = '1';
    client.setUsageEnabled(true);
    assert.equal(sent.length, n);
  },
);
console.log(`${checks} analytics checks passed.`);
sqlite.close();
