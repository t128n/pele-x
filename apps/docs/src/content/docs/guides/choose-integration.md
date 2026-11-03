---

title: Choose an integration
description: Pick the pele-x package that matches your Markdown pipeline.
---

pele-x ships three packages. They share the same renderer, fence syntax, options, and theming variables; they differ in how the diagram renderer is connected to your Markdown pipeline.

| Your site or pipeline                    | Install                                                    | Includes                            |
| ---------------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| Starlight documentation site             | [`starlight-pele`](https://npmx.dev/package/starlight-pele) | `astro-pele` and `mdast-pele`       |
| Plain Astro site                         | [`astro-pele`](https://npmx.dev/package/astro-pele)         | `mdast-pele`                        |
| Unified, remark, or Sätteri pipeline     | [`mdast-pele`](https://npmx.dev/package/mdast-pele)         | The core renderer and both adapters |

## Starlight

Use [`starlight-pele`](https://npmx.dev/package/starlight-pele) when the site is built with [Starlight](https://starlight.astro.build/). The plugin adds the Astro integration and maps Pele's color variables to Starlight's light and dark theme.

[Get started with Starlight](./getting-started-starlight/)

## Astro

Use [`astro-pele`](https://npmx.dev/package/astro-pele) for an Astro site that does not use Starlight. It injects the matching mdast adapter into Astro's Markdown processor and provides the optional zoom script.

[Get started with Astro](./getting-started-astro/)

## mdast

Use [`mdast-pele`](https://npmx.dev/package/mdast-pele) directly when you render Markdown through unified, remark, or Sätteri outside Astro. Choose the remark adapter for unified pipelines or the Sätteri adapter for `mdastPlugins`.

[Get started with mdast](./getting-started-mdast/)

## Next steps

Once the integration is installed, [authoring diagrams](./authoring/) is the same across all three packages. Package-specific options are listed in the [reference](../reference/mdast/).
