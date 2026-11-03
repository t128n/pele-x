---

title: mdast-pele plugin
description: Reference for the mdast-pele remark and Sätteri adapters, options, and helpers.
---

`mdast-pele` renders Mermaid fences to static SVG with [Pele](https://pele.run) in unified, remark, and Sätteri pipelines. It replaces matching mdast `code` nodes with raw HTML figures and works in Markdown and MDX.

The package also provides the renderer used by [`astro-pele`](./astro/) and [`starlight-pele`](./starlight/). Use it directly when you control the Markdown pipeline yourself.

**Package:** [`mdast-pele` on npmx](https://npmx.dev/package/mdast-pele) · [Source](https://github.com/t128n/pele-x/tree/main/packages/mdast)

## Install

```sh
bun add mdast-pele
```

`pele` is a dependency of `mdast-pele`, so you do not install it separately. The package is ESM-only and requires Node.js 20 or later.

## Entry points

| Import              | Exports                                      | Use                            |
| ------------------- | -------------------------------------------- | ------------------------------ |
| `mdast-pele`         | Core helpers and types                       | Rendering outside a pipeline   |
| `mdast-pele/remark`  | `remarkPele`                                 | Unified and remark             |
| `mdast-pele/satteri` | `satteriPele`                                | Sätteri `mdastPlugins`         |

## `remarkPele(options?)`

`remarkPele` returns a remark transformer. Register it before `remark-rehype` so the generated HTML passes through rehype unchanged.

```js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { remarkPele } from 'mdast-pele/remark';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const html = unified()
	.use(remarkParse)
	.use(remarkPele)
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypeStringify, { allowDangerousHtml: true })
	.processSync('```mermaid\nflowchart LR\n A --> B\n```')
	.toString();
```

The generated figure is raw HTML, so both `remark-rehype` and `rehype-stringify` need `allowDangerousHtml: true`. When unified provides a file path, `mdast-pele` uses it for deterministic ids and file-qualified errors.

## `satteriPele(options?)`

`satteriPele` returns an mdast plugin definition for Sätteri's `mdastPlugins` array.

```js
import { markdownToHtml } from 'satteri';
import { satteriPele } from 'mdast-pele/satteri';

const { html } = markdownToHtml(source, {
	mdastPlugins: [satteriPele()],
});
```

The adapter returns `{ raw: html, mdxExpressions: false }`. Braces such as `B{Works?}` remain diagram text and are not evaluated as MDX expressions. Warnings from `errorMode: 'warn'` are forwarded through Sätteri's `ctx.report`.

## Options

Both adapters accept `PelePluginOptions`:

| Option      | Type                                 | Default               | Description                                                                  |
| ----------- | ------------------------------------ | --------------------- | ---------------------------------------------------------------------------- |
| `languages` | `readonly string[]`                  | `['mermaid', 'pele']` | Fence languages to replace. Matching is case-sensitive.                      |
| `errorMode` | `'throw' \| 'placeholder' \| 'warn'` | `'throw'`             | How invalid diagrams are handled. See [Error handling](#error-handling).     |
| `zoom`      | `boolean \| 'marked'`                | `false`               | Mark every diagram for zoom, or only fences with the `zoom` metadata marker. |

Any other option is forwarded to Pele's `RenderOptions`. Commonly used renderer options include:

| Pele option      | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `fontFamily`     | Font stack used for diagram labels.                      |
| `fontFamilyMono` | Font stack used for monospace parts.                     |
| `fontSize`       | Base font size for diagram text.                         |
| `monospace`      | Parts rendered with the monospace font.                  |
| `responsive`     | Adapt the SVG to the available container width.          |
| `maxWidth`       | Maximum rendered width.                                  |
| `autoDirection`  | Choose a diagram direction based on the available width. |
| `padding`        | Inner padding around the diagram.                        |
| `limit`          | Source size limit enforced by Pele.                      |
| `outputLimit`    | Output size limit enforced by Pele.                      |
| `maxEdges`       | Maximum number of edges in a diagram.                    |
| `links`          | Enable or disable links in rendered diagrams.            |
| `linkSchemes`    | Allowed URL schemes for links.                           |
| `images`         | Enable or disable images in rendered diagrams.           |
| `imageSchemes`   | Allowed URL schemes for images.                          |
| `linkRel`        | `rel` attribute applied to rendered links.               |
| `icons`          | Resolver for diagram icons.                              |
| `math`           | Resolver for math markup.                                |
| `config`         | Pele configuration overrides.                            |
| `measurer`       | Custom text measurer.                                    |
| `now`            | Timestamp used by time-dependent diagrams.               |

See the [Pele API documentation](https://pele.run/api) for the complete option list and default values.

## Output

Each rendered fence becomes:

```html
<figure class="pele-diagram" data-pele-zoom>
	<svg>...</svg>
	<figcaption>Request path</figcaption>
</figure>
```

- `figcaption` is present only when the fence has `title="..."` metadata.
- `data-pele-zoom` is present only when the diagram is marked for zoom.
- The generated `idPrefix` keeps accessibility ids unique across diagrams.

Do not override `idPrefix` when using the adapters. The generated prefix is based on the file, fence position, and source.

## Error handling

`errorMode` controls invalid diagrams:

| Mode          | Behaviour                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------- |
| `throw`       | Stops processing and throws an error with the source file and mapped line. This is the default. |
| `placeholder` | Renders an escaped, readable message inside `<pre class="pele-error" role="alert">`.           |
| `warn`        | Renders the same placeholder and reports a warning when the adapter supports reporting.        |

Pele reports 1-based lines inside the fence body. `mdast-pele` adds the fence's opening line so errors point at the source document.

The Astro integration uses `throw` during production builds and `placeholder` during development and preview. An explicit `errorMode` always wins.

## API

The package exports these helpers from `mdast-pele`:

| Export                                     | Description                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `renderDiagram(source, options?)`          | Calls Pele's `render()` and returns `{ svg, width, height, type }`.             |
| `renderFenceToHtml(source, meta, context, options?)` | Renders one fence to the `<figure>` markup used by the adapters.       |
| `clearRenderCache()`                       | Clears the internal render cache.                                              |
| `diagramId(fileURL, index, source)`        | Returns the deterministic `pele-…` id prefix for a fence.                      |
| `parseFenceMeta(meta)`                     | Parses `title="..."` and the `zoom` marker from fence metadata.                |
| `isPeleLang(lang, options?)`               | Reports whether a fence language is handled by the plugin.                     |

The render cache is bounded to 100 entries and keyed by source, metadata, id prefix, and render options.

```js
import { renderDiagram } from 'mdast-pele';

const { svg, width, height, type } = renderDiagram('flowchart LR\n A --> B');
```

`renderFenceToHtml` accepts a `FenceContext` with `index`, an optional `fileURL`, an optional `line`, and an optional `report` callback.

## MDX

Fences work in MDX as well as Markdown. Keep Mermaid syntax inside a fenced code block rather than an inline expression; labels containing braces, such as `B{Works?}`, are then passed to Pele as text.

## Theming

Diagrams use the `--pele-*` CSS variables documented in [Theming](./theming/). The variables can be overridden on `.pele-diagram` or any ancestor without re-rendering the SVG.

## Security

`mdast-pele` emits raw HTML because diagrams are inline SVG. Enable `allowDangerousHtml` only for content you trust. For user-generated diagrams, validate or sandbox the source and restrict `linkSchemes` and `imageSchemes`.

Pele escapes diagram text, filters links and styles, and enforces source and output limits. See [Pele's security documentation](https://pele.run/security) for the full model.

## Compatibility

- Node.js 20 or later.
- ESM only; use `import`, not `require`.
- Unified, remark, and Sätteri pipelines.
- Astro and Starlight through `astro-pele` and `starlight-pele`.
- Markdown and MDX.

## Agent skill

The package ships an agent skill at `skills/mdast-pele/SKILL.md`. Tools that follow the [Agent Skills](https://agentskills.io) convention can discover it from `node_modules` with `npx skills-npm`.
