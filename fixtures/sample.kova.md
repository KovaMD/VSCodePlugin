---
title: Kova Syntax Fixture
author: RDMillen
theme: light
aspect_ratio: 16:9
date: 2026-08-23
logo: ./logo.png
footer: "{title} — {author}"
---

# Welcome to Kova

This slide exercises every token the Kova grammar should highlight. Template
variables like `{title}` only substitute in header/footer text (see the
`footer:` key above), never in slide body content, so this heading
deliberately doesn't use one.

<!-- layout: title -->
<!-- color: #ffffff -->
<!-- _class: invert -->

---

## Speaker notes and steps

Paragraphs use the trailing-inline form of the marker, on the same line. <!-- step -->

- List items can instead use a standalone marker on the line after the block.
- It only works after an eligible block (list, image, table, code, and a few others) — never after a plain paragraph, which is what produced the `#ERR` in the first draft of this fixture.

<!-- step: 3 -->

???

These are speaker notes, visible only in presenter view.

---

## Columns

Left column content goes here.

|||

Right column content goes here.

---

## Content directives

!youtube[Kova demo](https://www.youtube.com/watch?v=example)

!video[Local clip](./assets/demo.mp4)

!poll[Quick check](https://polls.example.com/1)

!progress[Rollout](0.75)

!ref[Millen, R. 2026. Kova Markdown Presentations]

!toc

!let base_color = "#0F7B6C"

!sheet revenue precision=2

| Quarter | Revenue |
| ------- | ------- |
| Q1      | 120     |
| Q2      | 141     |

!caption[Quarterly revenue, in thousands]

---

## Background image

![bg left:40%, contain](./assets/hero.jpg)

Content next to a background image.

---

## Callouts

> [!note]
> A plain note callout.

> [!warning] Careful here
> A warning callout with its own title.

---

<!-- hidden -->

This slide is excluded from the deck.
