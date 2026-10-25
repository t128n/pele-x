import { describe, expect, mock, test } from 'bun:test';
import type { MarkdownToHtmlResult } from 'satteri';
import { markdownToHtml } from 'satteri';
import type { FenceContext, FenceMeta, PelePluginOptions } from '../src/types.js';

if (Bun.env.SUPERLITE_REAL !== '1') {
	mock.module('../src/core.js', () => ({
		renderFenceToHtml: (
			source: string,
			_meta: FenceMeta,
			_context: FenceContext,
			options?: PelePluginOptions,
		) => {
			if (source === 'invalid' && options?.errorMode === 'placeholder') {
				return '<pre class="pele-error" role="alert">Invalid diagram</pre>';
			}
			return `<figure class="pele-diagram"><svg><text>${source}</text></svg></figure>`;
		},
	}));
	mock.module('../src/meta.js', () => ({
		isPeleLang: (lang: string | null | undefined) => lang === 'mermaid' || lang === 'pele',
		parseFenceMeta: () => ({ zoom: false }),
	}));
}

const { satteriPele } = await import('../src/satteri.js');

function process(markdown: string, options?: PelePluginOptions): string {
	return (
		markdownToHtml(markdown, { mdastPlugins: [satteriPele(options)] }) as MarkdownToHtmlResult
	).html;
}

describe('satteriPele', () => {
	test('renders mermaid fences as SVG', () => {
		expect(process('```mermaid\nflowchart LR\n A-->B\n```')).toContain('<svg');
	});

	test('leaves other language fences as code blocks', () => {
		const html = process('```ts\nconst value = 1;\n```');
		expect(html).toContain('<pre>');
		expect(html).toContain('language-ts');
		expect(html).not.toContain('<svg');
	});

	test('keeps braces in diagram labels as text', () => {
		const html = process('```mermaid\nflowchart LR\n A-->B{Works?}\n```');
		expect(html).toContain('<svg');
		expect(html).toContain('Works?');
	});

	test('renders an error placeholder for invalid diagrams', () => {
		const html = process('```mermaid\ninvalid\n```', { errorMode: 'placeholder' });
		expect(html).toContain('class="pele-error"');
	});
});
