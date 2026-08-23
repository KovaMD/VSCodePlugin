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

One known limitation: `|||` as a column break is ambiguous with an all-empty GFM table row. Kova's own parser disambiguates using table context; this grammar does not, so a `|||` inside a table may occasionally be mis-highlighted.

## Present with Kova...

Coming shortly: a command palette entry that saves the active file and launches `kova --present` on it.

## Development

This extension ships a declarative TextMate grammar only, so there's nothing to compile. Open this folder in VS Code, press F5 to launch an Extension Development Host, and open `fixtures/sample.kova.md` to check highlighting.

## License

GPL-3.0, matching the main [Kova](https://github.com/KovaMD/Kova) repository.
