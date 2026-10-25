# mdast-pele

Render Mermaid fences to static SVG with [Pele](https://pele.run) in remark and Sätteri pipelines.

The browser needs no JavaScript. The generated SVG is themed with CSS variables.

## Install

```sh
npm install mdast-pele
```

## Remark

````js
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
````

## Sätteri

```js
import { markdownToHtml } from 'satteri';
import { satteriPele } from 'mdast-pele/satteri';

const { html } = markdownToHtml(source, { mdastPlugins: [satteriPele()] });
```

## Options

`langs`, `errorMode`, `zoom`, `wrapper`, `className`, `caption` and all Pele `render()` options are supported. Add `zoom` to a fence to mark it for pan and zoom.

Full docs: https://t128n.github.io/pele-x/
