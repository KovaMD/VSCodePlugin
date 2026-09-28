# Kova for VS Code

Syntax highlighting for [Kova](https://kova.md) Markdown presentations, plus a **Present with Kova...** command to launch a file straight into fullscreen presentation mode.

Kova is a native desktop app that turns Markdown into slide decks. This extension does not require Kova to be installed to get highlighting; the Present command does, since it launches the Kova binary directly.

Install Kova: https://github.com/KovaMD/Kova/releases

## What's highlighted

Kova extends plain Markdown with a small, closed set of directives. This extension highlights all of them on top of VS Code's built-in Markdown grammar:

- **Frontmatter keys** — `title`, `author`, `theme`, `theme_overrides`, `aspect_ratio`, `date`, `logo`, `footer`
- **Structural markers** — `---` (slide separator), `???` (speaker notes), `|||` (column break)
- **Slide comment directives** — `<!-- layout: NAME -->`, `<!-- hidden -->`, `<!-- color: ... -->`, `<!-- _color: ... -->`, `<!-- _class: ... -->`, `<!-- step -->` / `<!-- step: N -->`
- **Content directives** — `!youtube[...]`, `!video[...]`, `!poll[...]`, `!progress[...]`, `!ref[...]`, `!caption[...]`, `!toc`, `!let`, `!sheet`
- **Background images** — `![bg left:40%, contain](path.jpg)`
- **Callouts** — `> [!note]`, `> [!warning] Title`, and other Obsidian/GitHub-style admonitions
- **Template variables** — `{title}`, `{author}`, `{date}`, `{slide_number}`, `{total}`

See [`fixtures/sample.kova.md`](./fixtures/sample.kova.md) for one file exercising every token, and the [full syntax spec](https://github.com/KovaMD/Kova/blob/main/.github/CONTRIBUTING.md) in the main Kova repo.

Two known limitations:

- `|||` as a column break is ambiguous with an all-empty GFM table row. Kova's own parser disambiguates using table context; this grammar does not, so a `|||` inside a table may occasionally be mis-highlighted.
- Frontmatter keys are matched on any line that looks like `key:`, not just inside the leading `---`…`---` block (a TextMate injection grammar can't reliably track that boundary). A slide body line that happens to start with `title:`, `date:`, etc. will be highlighted as if it were a frontmatter key.

## Present with Kova...

Run **Kova: Present with Kova...** from the command palette, or use the play icon in the editor title bar on any Markdown file. It saves the file if there are unsaved changes, then launches `kova --present` on it. If Kova isn't found on your PATH (or, on Linux, isn't installed as a Flatpak either), you'll get a prompt linking to the releases page instead of a silent failure.

## Snippets

Type a prefix and press Tab in a Markdown file: `kova-slide`, `kova-notes`, `kova-col`, `kova-layout`, `kova-step`, `kova-yt`, `kova-video`, `kova-poll`, `kova-progress`, `kova-ref`, `kova-toc`, `kova-caption`, `kova-let`, `kova-sheet`, `kova-bg`, `kova-note` / `kova-tip` / `kova-warning` / `kova-danger` / `kova-info`, and `kova-frontmatter`.

## Development

```
npm install
npm run compile
```

Then press F5 to launch an Extension Development Host with `fixtures/sample.kova.md` already open, to check both highlighting and the present command.

`npm test` runs a headless tokenizer test against the grammar (loads `kova.tmLanguage.json` directly via `vscode-textmate`/`vscode-oniguruma` and asserts on the scopes it produces) — no editor required. `npm run package` builds a `.vsix` with `vsce` as a packaging smoke test. Both run in CI on every push and PR.

## License

GPL-3.0, matching the main [Kova](https://github.com/KovaMD/Kova) repository.
