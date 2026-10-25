import { beforeEach, describe, expect, spyOn, test } from 'bun:test';
import * as pele from 'pele';
import {
	clearRenderCache,
	diagramId,
	isPeleLang,
	parseFenceMeta,
	renderDiagram,
	renderFenceToHtml,
} from '../src/index.js';

const source = 'flowchart LR\n A-->B';

beforeEach(() => {
	clearRenderCache();
});

describe('renderFenceToHtml', () => {
	test('renders a figure containing SVG and an optional caption', () => {
		const html = renderFenceToHtml(source, { title: 'Arch', zoom: false }, { index: 0 });

		expect(html).toStartWith('<figure class="pele-diagram">');
		expect(html).toContain('<svg');
		expect(html).toContain('<figcaption>Arch</figcaption>');
		expect(html).toEndWith('</figure>');
	});

	test('adds the file and mapped source line to thrown errors', () => {
		expect(() =>
			renderFenceToHtml(
				'flowchart LR\n A -->',
				{ zoom: false },
				{ fileURL: 'a.md', index: 0, line: 1 },
			),
		).toThrow('a.md:3');
	});

	test('escapes captions and error placeholders', () => {
		const captioned = renderFenceToHtml(
			source,
			{ title: '<Arch & "Ops">', zoom: false },
			{ index: 0 },
		);
		expect(captioned).toContain('<figcaption>&lt;Arch &amp; &quot;Ops&quot;&gt;</figcaption>');

		const placeholder = renderFenceToHtml(
			'flowchart LR\n A --> <bad>',
			{ zoom: false },
			{ index: 0 },
			{ errorMode: 'placeholder' },
		);
		expect(placeholder).toStartWith('<pre class="pele-error" role="alert">');
		expect(placeholder).toContain('&lt;bad&gt;');
		expect(placeholder).not.toContain('<bad>');
	});

	test('warn reports the error and renders a placeholder', () => {
		const reports: string[] = [];
		const html = renderFenceToHtml(
			'invalid',
			{ zoom: false },
			{ index: 0, report: (message) => reports.push(message) },
			{ errorMode: 'warn' },
		);

		expect(reports).toHaveLength(1);
		expect(reports[0]).toContain('No diagram type detected');
		expect(html).toContain('class="pele-error"');
	});

	test('marks diagrams according to the zoom option', () => {
		expect(renderFenceToHtml(source, { zoom: false }, { index: 0 }, { zoom: true })).toContain(
			'data-pele-zoom',
		);
		expect(renderFenceToHtml(source, { zoom: true }, { index: 0 }, { zoom: 'marked' })).toContain(
			'data-pele-zoom',
		);
		expect(renderFenceToHtml(source, { zoom: true }, { index: 0 })).not.toContain('data-pele-zoom');
	});
});

describe('metadata and ids', () => {
	test('parses quoted titles and the zoom marker', () => {
		expect(parseFenceMeta('title="Arch" zoom')).toEqual({ title: 'Arch', zoom: true });
		expect(parseFenceMeta("title='System overview'")).toEqual({
			title: 'System overview',
			zoom: false,
		});
		expect(parseFenceMeta(null)).toEqual({ zoom: false });
	});

	test('matches only configured, case-sensitive languages', () => {
		expect(isPeleLang('mermaid')).toBe(true);
		expect(isPeleLang('pele')).toBe(true);
		expect(isPeleLang('Mermaid')).toBe(false);
		expect(isPeleLang('ts')).toBe(false);
		expect(isPeleLang('ts', { languages: ['ts'] })).toBe(true);
	});

	test('creates deterministic, safe ids that differ by index', () => {
		const first = diagramId('file:///a.md', 0, source);
		const second = diagramId('file:///a.md', 1, source);

		expect(first).toBe(diagramId('file:///a.md', 0, source));
		expect(first).toStartWith('pele-');
		expect(first).toMatch(/^[A-Za-z0-9_-]+$/);
		expect(second).not.toBe(first);
	});
});

describe('renderDiagram cache', () => {
	test('returns equal output before and after clearing the cache', () => {
		const first = renderFenceToHtml(source, { zoom: false }, { index: 0 });
		expect(renderFenceToHtml(source, { zoom: false }, { index: 0 })).toBe(first);

		clearRenderCache();
		expect(renderFenceToHtml(source, { zoom: false }, { index: 0 })).toBe(first);
		expect(renderDiagram(source, { idPrefix: 'pele-direct' })).toEqual(
			renderDiagram(source, { idPrefix: 'pele-direct' }),
		);
	});

	test('reuses matching renders and evicts the oldest entry beyond the cap', () => {
		const renderSpy = spyOn(pele, 'render');
		try {
			const first = renderFenceToHtml(source, { zoom: false }, { index: 0 });
			expect(renderFenceToHtml(source, { zoom: false }, { index: 0 })).toBe(first);
			expect(renderSpy).toHaveBeenCalledTimes(1);

			for (let index = 1; index <= 100; index++) {
				renderFenceToHtml(source, { zoom: false }, { index });
			}
			expect(renderSpy).toHaveBeenCalledTimes(101);

			expect(renderFenceToHtml(source, { zoom: false }, { index: 0 })).toBe(first);
			expect(renderSpy).toHaveBeenCalledTimes(102);
		} finally {
			renderSpy.mockRestore();
		}
	});
});
