---
title: Troubleshooting
description: Resolve processor, rendering, MDX, id, and zoom problems.
---

## Unsupported processor

If setup reports an unsupported Markdown processor, configure Astro with `satteri()` from `@astrojs/markdown-satteri` or `unified()` from `@astrojs/markdown-remark`. The integration selects its adapter from the processor name and cannot inject into a custom processor automatically.

## No SVG appears

Check that the fence language is exactly `mermaid` or `pele`, with matching case, and that the integration is registered. Rebuild packages before building a workspace documentation site. In development, an invalid diagram may intentionally show a `.pele-error` placeholder; read its message for the file and line.

## Braces break an MDX page

Keep Mermaid syntax inside a fenced code block rather than inline JSX or an MDX expression. Labels such as `B{Works?}` are then passed to Pele as text. Update to a build that includes the MDX-safe adapter if an older configuration evaluates the braces.

## Duplicate accessibility ids

Do not reuse rendered SVG markup or assign the same Pele `idPrefix` to several fences. The supplied adapters generate deterministic ids from the file, fence position, and source. If ids collide after copying HTML manually, render each fence through the integration instead.

## Zoom does not load

Zoom is off by default. Set `zoom: true` for every diagram or `zoom: 'marked'` together with the `zoom` fence marker. Only marked diagrams receive `data-pele-zoom` in marked mode, and the browser module is injected only when zoom is enabled. Check the option and rebuild if no marker or script appears.
