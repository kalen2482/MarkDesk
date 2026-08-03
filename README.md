# MarkDesk

[简体中文](README.zh-CN.md)

MarkDesk is a lightweight, local-first Markdown editor for Windows. It combines source editing and rich visual editing in one desktop application, so you can write Markdown without giving up a rendered, document-like workflow.

## Highlights

- **Two-way editing** — edit Markdown source or the rendered document directly; both stay synchronized.
- **Three focused views** — source, split, and visual modes support writing, review, and reading.
- **Local-first privacy** — no account, cloud synchronization, or server-side document processing.
- **Lightweight desktop app** — a focused Electron application with a Vite-powered React interface.
- **Markdown coverage** — CommonMark and GFM, plus KaTeX math, Mermaid diagrams, callouts, footnotes, highlights, underline, and `[TOC]`.
- **Productive navigation** — live heading outline with precise preview navigation.
- **Comfortable writing** — code highlighting, search/replace, dark mode, shortcuts, autosave, statistics, and synchronized scrolling.
- **Windows integration** — NSIS installer, custom icon, desktop/start-menu shortcuts, and `.md`, `.markdown`, `.mdx` file associations.

## Tech Stack

| Area | Technology |
| --- | --- |
| Desktop runtime | Electron 31 |
| UI | React 18 + TypeScript |
| Build tooling | Vite 5 |
| Styling | Tailwind CSS 3 |
| Markdown | marked, marked-highlight, marked-gfm-heading-id |
| Code highlighting | highlight.js |
| Math and diagrams | KaTeX and Mermaid |
| Security | DOMPurify |
| Packaging | electron-builder (Windows NSIS) |

## Development

Requires Node.js 18+ and npm.

```bash
npm install
npm run dev
npm run build
```

Create a Windows installer with:

```bash
npm run dist:win
```

## Privacy

MarkDesk is designed for local document work. It does not upload document content to a cloud service. External images and links embedded in a document can still be requested when that document is opened; avoid external URLs for a fully offline workflow.

## License

Licensed under the [Apache License 2.0](LICENSE).
