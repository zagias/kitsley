import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const token = name => [...css.matchAll(new RegExp(`${name}:(#[0-9a-f]{6}|#[0-9a-f]{3})[;}]`, 'gi'))].at(-1)?.[1];
const hex = h => h.length === 4 ? '#' + [...h.slice(1)].map(c => c + c).join('') : h;
const lum = h => { const c = [1, 3, 5].map(i => parseInt(hex(h).slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

test('Accent text colours stay readable on the page, card and tint backgrounds', () => {
  for (const [fg, bg] of [['--orange-text', '--orange-tint'], ['--orange-text', '--paper'], ['--orange-text', '--card'], ['--teal-text', '--paper'], ['--teal-text', '--card'], ['--teal-text', '--green'], ['--muted', '--paper']]) {
    assert.ok(ratio(token(fg), token(bg)) >= 4.5, `${fg} on ${bg} is ${ratio(token(fg), token(bg)).toFixed(2)}`);
  }
});

test('Orange and teal fills are not used directly as small text colours', () => {
  const rules = [...css.matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter(([, sel]) => !sel.includes('.kitsley-mark'));
  const offenders = rules.filter(([, , body]) => /(?<![-\w])color:var\(--(orange|blue)\)/.test(body)).map(([, sel]) => sel.trim());
  assert.deepEqual(offenders, []);
});
