---

title: Astro integration
description: Add static Mermaid diagrams directly to an Astro site.
---

Use `astro-pele` when your site does not use Starlight. Add `pele()` to the integrations in `astro.config.mjs`:

**Package:** [`astro-pele` on npmx](https://npmx.dev/package/astro-pele) · [Source](https://github.com/t128n/pele-x/tree/main/packages/astro)

```js
import { pele } from 'astro-pele';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [pele()],
});
```

The integration supports Astro's default `satteri()` processor and the `unified()` processor from `@astrojs/markdown-remark`. It selects the matching [mdast-pele](./mdast/) adapter automatically.

Import `astro-pele/theme.css` for a neutral light and dark diagram theme. Then add a fence to any Markdown or MDX page:

```mermaid title="Astro diagram"
flowchart LR
	Astro --> SVG
```

Zoom is disabled by default. Enable it for every diagram with `pele({ zoom: true })`, or only for fences carrying the `zoom` metadata marker with `pele({ zoom: 'marked' })`.
