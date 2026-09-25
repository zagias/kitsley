import test from 'node:test';
import assert from 'node:assert/strict';
import {library} from '../lib/library.mjs';
import {safetyGuides,safetyDisclaimer} from '../lib/safety-guides.mjs';

const text = g => [...g.emergency, ...g.briefing, ...g.steps.flatMap(s => [s.title, s.body, s.safety || '']), ...g.pro].join(' ');

test('Every urgent-and-safety topic has a safety briefing, ordered steps, pro triggers and sources', () => {
  for (const p of library.filter(p => p.category === 'safety')) {
    const g = safetyGuides[p.id];
    assert.ok(g, p.id);
    assert.ok(g.emergency.length && g.briefing.length && g.pro.length, p.id);
    assert.ok(g.steps.length >= 5 && g.steps.every(s => s.title && s.body), p.id);
    assert.ok(g.sources.length && g.sources.every(([label, url]) => label && /^https:\/\//.test(url)), p.id);
  }
});

test('Safety guides never tell people to shut off gas or reach a panel through water', () => {
  for (const [id, g] of Object.entries(safetyGuides)) {
    const t = text(g);
    assert.doesNotMatch(t.replace(/never try to shut off the gas yourself/gi, ''), /(shut|turn) off the gas/i, id);
    for (const s of g.steps) {
      if (/breaker|panel/i.test(s.body) && /switch off|turn off/i.test(s.body)) assert.match(s.body + ' ' + (s.safety || ''), /dry|utility/i, `${id}: ${s.title}`);
    }
  }
});

test('The safety disclaimer puts emergency help first and limits the guide’s scope', () => {
  const d = safetyDisclaimer.join(' ');
  assert.match(d, /911/);
  assert.match(d, /not professional/i);
  assert.match(d, /licensed professionals/i);
});
