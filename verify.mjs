import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
mkdirSync('work/tests', { recursive: true });
for (const name of ['network', 'persistence']) {
  const source = readFileSync(`lib/${name}.ts`, 'utf8');
  const js = ts
    .transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
      },
    })
    .outputText.replace("'./network'", "'./network.mjs'");
  writeFileSync(`work/tests/${name}.mjs`, js);
}
const {
  canonicalUrl,
  demoNetwork,
  emptyNetwork,
  lastContact,
  conversationsFor,
} = await import('./work/tests/network.mjs');
const { validateNetwork, repository } =
  await import('./work/tests/persistence.mjs');
const d = demoNetwork();
let checks = 0;
const check = (name, fn) => {
  fn();
  checks++;
  console.log(`PASS ${name}`);
};
check('LinkedIn URL canonicalization', () =>
  assert.equal(
    canonicalUrl('https://linkedin.com/in/Isaac/?trk=profile'),
    'https://www.linkedin.com/in/isaac',
  ),
);
check('Reject unsafe and unrelated URLs', () => {
  for (const u of [
    'javascript:alert(1)',
    'https://linkedin.com.evil.test/in/name',
    'https://example.com/in/name',
    'http://linkedin.com/in/name',
    'https://linkedin.com/in/',
  ])
    assert.equal(canonicalUrl(u), '');
});
check('Export/import preserves all normalized entities', () =>
  assert.deepEqual(validateNetwork(JSON.parse(JSON.stringify(d))), d),
);
check('Empty workspace is valid', () =>
  assert.deepEqual(validateNetwork(emptyNetwork()), emptyNetwork()),
);
check('Duplicate URLs cannot enter through import', () => {
  const x = structuredClone(d);
  x.people[1].linkedinUrl = x.people[0].linkedinUrl;
  assert.throws(() => validateNetwork(x));
});
check('Dangling relationships are rejected', () => {
  const x = structuredClone(d);
  x.relationships[0].target = 'missing';
  assert.throws(() => validateNetwork(x));
});
check('Malformed and missing fields are rejected', () => {
  for (const key of [
    'name',
    'tags',
    'strength',
    'role',
    'initialCount',
    'position',
  ]) {
    const x = structuredClone(d);
    delete x.people[0][key];
    assert.throws(() => validateNetwork(x));
  }
});
check('Broken conversations and invalid action completion are rejected', () => {
  const x = structuredClone(d);
  x.conversations[0].actions[0].completed = 'yes';
  assert.throws(() => validateNetwork(x));
});
check('Invalid dates are rejected', () => {
  const x = structuredClone(d);
  x.people[0].followUp = '2026-02-31';
  assert.throws(() => validateNetwork(x));
});
check(
  'Conversation history sorts newest first without changing baseline date',
  () => {
    const x = structuredClone(d);
    x.conversations.push({
      ...x.conversations[0],
      id: 'new',
      date: '2026-09-06',
    });
    assert.equal(conversationsFor(x, 'demo-0')[0].id, 'new');
    assert.equal(lastContact(x, x.people[0]), '2026-09-06');
    x.conversations = x.conversations.filter((c) => c.id !== 'new');
    assert.equal(lastContact(x, x.people[0]), '2026-09-03');
  },
);
check('Browser storage roundtrip survives a reload', () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (k) => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
  };
  repository.save(d);
  assert.deepEqual(repository.load(), d);
});
console.log(`${checks} checks passed.`);
