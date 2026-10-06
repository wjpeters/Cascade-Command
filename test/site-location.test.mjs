import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalGameUrl, ensureCanonicalLocation } from '../src/site-location.js';
const canonical = 'https://riskstudio-cascade-command.codexwillem.chatgpt.site';
test('the verified gateway alias redirects to the existing site and preserves page, query and hash', () => {
  for (const path of ['/', '/leaderboard?theme=classic#prizes', '/admin#stats', '/?return_to=https%3A%2F%2Fexample.com', '/%2Fexample.com']) {
    assert.equal(canonicalGameUrl('https://game.riskstudio.com' + path), canonical + path);
  }
  for (const origin of [canonical, 'http://localhost:4317', 'http://192.168.1.4:4317', 'https://game.riskstudio.com.evil.example', 'https://game.riskstudio.com:444', 'https://example.com']) {
    assert.equal(canonicalGameUrl(origin + '/leaderboard'), null);
  }
});
test('navigation precedes initialization and uses replace to avoid a broken back-button entry', async () => {
  const calls = [];
  const pending = ensureCanonicalLocation({ href: 'https://game.riskstudio.com/leaderboard?theme=classic', replace: url => calls.push(url) });
  assert.deepEqual(calls, [canonical + '/leaderboard?theme=classic']);
  assert.ok(pending instanceof Promise);
  let initialized = false; pending.then(() => initialized = true);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(initialized, false);
  assert.equal(ensureCanonicalLocation({ href: canonical, replace: () => assert.fail('redirect loop') }), undefined);
});
