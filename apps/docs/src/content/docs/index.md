---

title: pele-x
description: Native Pele integrations for mdast, Astro and Starlight.
---

pele-x brings [Pele](https://pele.run), the fast Mermaid-to-SVG renderer, into the JavaScript ecosystem. It turns Mermaid fences into inline SVG at build time, so diagrams are themeable and accessible without shipping a browser-side Mermaid runtime.

```mermaid title="From Markdown to SVG"
flowchart LR
	A[Markdown fence] --> B[pele-x]
	B --> C[Static SVG]
```

## Packages

| Package          | Purpose                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| `mdast-pele`     | Core renderer plus remark and Sätteri adapters                         |
| `astro-pele`     | Astro integration, `<Pele />` component, neutral theme and zoom script |
| `starlight-pele` | Starlight plugin and light/dark theme                                  |

The packages use the `*-pele` naming convention because they integrate Pele into each ecosystem. The project and repository are called `pele-x`.

## Why static SVG?

Rendering diagrams during the build keeps pages fast. The browser does not download a Mermaid runtime, parse diagram source, or execute layout code. The SVG that reaches readers is small, predictable, and styled with the same CSS variables as the rest of the page.

## Start here

- [Choose an integration](./guides/choose-integration/) if you are not sure which package fits your site.
- [Get started with Starlight](./guides/getting-started-starlight/), [Astro](./guides/getting-started-astro/), or [mdast](./guides/getting-started-mdast/) to render your first diagram.
- [Author diagrams](./guides/authoring/) to add captions, zoom markers, MDX content, and clear errors.
- [Reference](./reference/mdast/) lists the package options and the diagram gallery.
- [Troubleshooting](./explanation/troubleshooting/) explains how rendering works and how to fix common problems.

Use either `mermaid` or `pele` as the fence language. Other code fences are left unchanged.
