'use strict';

// Headless tokenizer test for the Kova TextMate grammar. Loads the grammar
// directly (not injected into VS Code's real markdown grammar) and tokenizes
// lines with it as the top-level grammar. This is equivalent to how it
// behaves as an injection because every rule in kova.tmLanguage.json is a
// single-line `match` with no begin/end state (see the "Stateless by design"
// comment in the grammar file) — the injectionSelector only matters when
// resolving injections against a host grammar, not when tokenizing directly.

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const oniguruma = require('vscode-oniguruma');
const textmate = require('vscode-textmate');

const GRAMMAR_PATH = path.join(__dirname, '..', 'syntaxes', 'kova.tmLanguage.json');
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'sample.kova.md');
const SCOPE_NAME = 'markdown.kova.injection';

let grammarPromise;

function loadGrammar() {
  if (!grammarPromise) {
    grammarPromise = (async () => {
      const wasmPath = require.resolve('vscode-oniguruma/release/onig.wasm');
      const wasmBin = fs.readFileSync(wasmPath).buffer;
      await oniguruma.loadWASM(wasmBin);

      const onigLib = Promise.resolve({
        createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
        createOnigString: (s) => new oniguruma.OnigString(s),
      });

      const grammarData = JSON.parse(fs.readFileSync(GRAMMAR_PATH, 'utf8'));

      const registry = new textmate.Registry({
        onigLib,
        loadGrammar: async (scopeName) => (scopeName === SCOPE_NAME ? grammarData : null),
      });

      const grammar = await registry.loadGrammar(SCOPE_NAME);
      assert.ok(grammar, `failed to load grammar ${SCOPE_NAME}`);
      return grammar;
    })();
  }
  return grammarPromise;
}

/** Tokenizes a single line in isolation, returning [{ text, scopes }, ...]. */
async function tokenizeLine(line) {
  const grammar = await loadGrammar();
  const result = grammar.tokenizeLine(line, textmate.INITIAL);
  return result.tokens.map((t) => ({
    text: line.slice(t.startIndex, t.endIndex),
    scopes: t.scopes,
  }));
}

function hasScope(tokens, text, scopeSuffix) {
  return tokens.some((t) => t.text === text && t.scopes.some((s) => s.endsWith(scopeSuffix)));
}

function assertScope(tokens, text, scopeSuffix, line) {
  assert.ok(
    hasScope(tokens, text, scopeSuffix),
    `expected "${text}" to carry scope "${scopeSuffix}" when tokenizing: ${line}\n` +
      `got: ${JSON.stringify(tokens, null, 2)}`,
  );
}

test('frontmatter key is scoped as a property name', async () => {
  const line = 'title: Kova Syntax Fixture';
  const tokens = await tokenizeLine(line);
  assertScope(tokens, 'title', 'support.type.property-name.kova', line);
  assertScope(tokens, ':', 'punctuation.separator.key-value.kova', line);
});

test('slide separator, speaker notes, and column break are scoped as bare markers', async () => {
  assertScope(await tokenizeLine('---'), '---', 'keyword.control.separator.slide.kova', '---');
  assertScope(await tokenizeLine('???'), '???', 'keyword.control.marker.notes.kova', '???');
  assertScope(await tokenizeLine('|||'), '|||', 'keyword.control.separator.column.kova', '|||');
});

test('comment directives scope the key and value, hyphenated values included', async () => {
  for (const line of [
    '<!-- layout: title -->',
    '<!-- layout: full-bleed -->',
    '<!-- _class: two-column -->',
    '<!-- color: #ffffff -->',
  ]) {
    const tokens = await tokenizeLine(line);
    assertScope(tokens, line.match(/<!--\s*(\S+):/)[1], 'keyword.control.directive.kova', line);
    const value = line.match(/:\s*([^>]*?)\s*-->/)[1];
    assertScope(tokens, value, 'string.unquoted.directive-value.kova', line);
  }
});

test('comment directive flags without a value still scope the key', async () => {
  for (const line of ['<!-- hidden -->', '<!-- step -->']) {
    const tokens = await tokenizeLine(line);
    const key = line.match(/<!--\s*(\S+)/)[1];
    assertScope(tokens, key, 'keyword.control.directive.kova', line);
  }
});

test('bracketed bang directives scope the name, label, and link', async () => {
  const line = '!youtube[Kova demo](https://www.youtube.com/watch?v=example)';
  const tokens = await tokenizeLine(line);
  assertScope(tokens, 'youtube', 'keyword.control.directive.bang.kova', line);
  assertScope(tokens, 'Kova demo', 'string.other.label.kova', line);
  assertScope(tokens, 'https://www.youtube.com/watch?v=example', 'string.other.link.kova', line);
});

test('label-only bang directives (no link) still scope the name and label', async () => {
  const line = '!ref[Millen, R. 2026. Kova Markdown Presentations]';
  const tokens = await tokenizeLine(line);
  assertScope(tokens, 'ref', 'keyword.control.directive.bang.kova', line);
  assertScope(tokens, 'Millen, R. 2026. Kova Markdown Presentations', 'string.other.label.kova', line);
});

test('bare bang directives (!let, !sheet) scope the name', async () => {
  assertScope(
    await tokenizeLine('!let base_color = "#0F7B6C"'),
    'let',
    'keyword.control.directive.bang.kova',
    '!let',
  );
  assertScope(
    await tokenizeLine('!sheet revenue precision=2'),
    'sheet',
    'keyword.control.directive.bang.kova',
    '!sheet',
  );
});

test('!toc scopes as a bang directive with no trailing content', async () => {
  assertScope(await tokenizeLine('!toc'), 'toc', 'keyword.control.directive.bang.kova', '!toc');
});

test('background image directive scopes bg and the path', async () => {
  const line = '![bg left:40%, contain](./assets/hero.jpg)';
  const tokens = await tokenizeLine(line);
  assertScope(tokens, 'bg left:40%, contain', 'keyword.control.directive.bgimage.kova', line);
  assertScope(tokens, './assets/hero.jpg', 'string.other.link.kova', line);
});

test('callouts scope the admonition type and an optional title', async () => {
  assertScope(await tokenizeLine('> [!note]'), 'note', 'keyword.control.callout-type.kova', '> [!note]');
  const withTitle = '> [!warning] Careful here';
  const tokens = await tokenizeLine(withTitle);
  assertScope(tokens, 'warning', 'keyword.control.callout-type.kova', withTitle);
  assertScope(tokens, 'Careful here', 'markup.italic.callout-title.kova', withTitle);
});

test('template variables are scoped only by their recognized names', async () => {
  const tokens = await tokenizeLine('{title} and {slide_number} of {total}, but not {bogus}');
  assertScope(tokens, 'title', 'variable.parameter.kova', '{title}');
  assertScope(tokens, 'slide_number', 'variable.parameter.kova', '{slide_number}');
  assertScope(tokens, 'total', 'variable.parameter.kova', '{total}');
  assert.ok(
    !hasScope(tokens, 'bogus', 'variable.parameter.kova'),
    'unrecognized template variable names should not be scoped',
  );
});

test('!let and !sheet require a word boundary — prose starting with "let"/"sheet" is not a directive', async () => {
  const tokens = await tokenizeLine('!letter is not a directive');
  assert.ok(
    !hasScope(tokens, 'letter', 'keyword.control.directive.bang.kova'),
    '"!letter" should not be mistaken for the "!let" directive',
  );
});

test('the shared fixture tokenizes fully without throwing', async () => {
  const grammar = await loadGrammar();
  const lines = fs.readFileSync(FIXTURE_PATH, 'utf8').split('\n');
  let ruleStack = textmate.INITIAL;
  for (const line of lines) {
    const result = grammar.tokenizeLine(line, ruleStack);
    ruleStack = result.ruleStack;
    assert.ok(result.tokens.length > 0, `expected at least one token for line: ${JSON.stringify(line)}`);
  }
});
