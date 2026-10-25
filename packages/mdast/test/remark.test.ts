import { describe, expect, test } from 'bun:test';
import type { Root } from 'mdast';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { remarkPele } from '../src/remark.js';
import type { PelePluginOptions } from '../src/types.js';

function process(markdown: string, options?: PelePluginOptions): string {
	return unified()
		.use(remarkParse as never)
		.use(remarkPele as never, options)
		.use(remarkRehype as never, { allowDangerousHtml: true })
		.use(rehypeStringify as never, { allowDangerousHtml: true })
		.processSync(markdown)
		.toString();
}

describe('remarkPele', () => {
	test('renders mermaid fences as SVG', () => {
		expect(process('```mermaid\nflowchart LR\n A-->B\n```')).toContain('<svg');
	});

	test('leaves other language fences as code blocks', () => {
		const html = process('```ts\nconst value = 1;\n```');
		expect(html).toContain('language-ts');
		expect(html).not.toContain('<svg');
	});

	test('renders a caption from fence metadata', () => {
		expect(process('```mermaid title="Arch"\nflowchart LR\n A-->B\n```')).toContain(
			'<figcaption>Arch</figcaption>',
		);
	});

	test('preserves the source position when replacing a code node', () => {
		const position = {
			start: { line: 3, column: 1, offset: 12 },
			end: { line: 5, column: 4, offset: 42 },
		};
		const tree: Root = {
			type: 'root',
			children: [
				{
					type: 'code',
					lang: 'mermaid',
					meta: null,
					value: 'flowchart LR\n A-->B',
					position,
				},
			],
		};

		remarkPele()(tree, { path: 'a.md' });
		expect(tree.children[0]?.type).toBe('html');
		expect(tree.children[0]?.position).toEqual(position);
	});
});
