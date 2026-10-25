import { describe, expect, test } from 'bun:test';
import type { Code } from 'mdast';
import type { MarkdownToHtmlResult, MdastVisitorContext } from 'satteri';
import { markdownToHtml } from 'satteri';
import { satteriPele } from '../src/satteri.js';
import type { PelePluginOptions } from '../src/types.js';

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
		expect(html).toContain('No diagram type detected');
	});

	test('returns raw HTML without MDX expressions and forwards warning reports', () => {
		const reports: Parameters<MdastVisitorContext['report']>[0][] = [];
		const node: Code = {
			type: 'code',
			lang: 'mermaid',
			meta: null,
			value: 'invalid',
			position: {
				start: { line: 4, column: 1 },
				end: { line: 6, column: 4 },
			},
		};
		const result = satteriPele({ errorMode: 'warn' }).code?.(node, {
			fileURL: new URL('file:///a.md'),
			indexOf: () => 0,
			report: (report: Parameters<MdastVisitorContext['report']>[0]) => reports.push(report),
		} as unknown as MdastVisitorContext);

		expect(result).toEqual({
			raw: '<pre class="pele-error" role="alert">/a.md:4: No diagram type detected for the given text.</pre>',
			mdxExpressions: false,
		});
		expect(reports).toEqual([
			{
				message: '/a.md:4: No diagram type detected for the given text.',
				node,
				severity: 'warning',
			},
		]);
	});
});
