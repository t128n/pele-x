import { describe, expect, mock, test } from 'bun:test';
import type { AstroIntegration } from 'astro';
import { remarkPele } from 'mdast-pele/remark';
import type { AstroPeleOptions } from '../src/index.js';
import { pele, resolveOptions } from '../src/index.js';

type SetupOptions = Parameters<NonNullable<AstroIntegration['hooks']['astro:config:setup']>>[0];

interface FakeProcessor {
	name: string;
	options: {
		mdastPlugins: unknown[];
		remarkPlugins: unknown[];
	};
}

function processor(name: string): FakeProcessor {
	return { name, options: { mdastPlugins: [], remarkPlugins: [] } };
}

function setup(
	markdownProcessor: FakeProcessor,
	options?: AstroPeleOptions,
	integration: AstroIntegration = pele(options),
	command: 'dev' | 'build' | 'preview' = 'build',
): Array<[string, string]> {
	const scripts: Array<[string, string]> = [];
	const hook = integration.hooks['astro:config:setup'];
	if (!hook) throw new Error('Missing astro:config:setup hook');
	hook({
		config: { markdown: { processor: markdownProcessor } },
		command,
		injectScript: (stage: string, content: string) => scripts.push([stage, content]),
	} as unknown as SetupOptions);
	return scripts;
}

describe('pele integration', () => {
	test('adds one mdast plugin to a Sätteri processor', () => {
		const markdownProcessor = processor('satteri');
		setup(markdownProcessor);

		expect(markdownProcessor.options.mdastPlugins).toHaveLength(1);
		expect(markdownProcessor.options.remarkPlugins).toHaveLength(0);
	});

	test('adds one remark plugin to a unified processor', () => {
		const markdownProcessor = processor('unified');
		setup(markdownProcessor);

		expect(markdownProcessor.options.remarkPlugins).toHaveLength(1);
		expect(markdownProcessor.options.mdastPlugins).toHaveLength(0);
		const entry = markdownProcessor.options.remarkPlugins[0];
		expect(Array.isArray(entry)).toBe(true);
		const [plugin, options] = entry as [typeof remarkPele, AstroPeleOptions];
		expect(plugin).toBe(remarkPele);
		expect(options).toEqual({ errorMode: 'throw' });
	});

	test('rejects unknown processors with a useful error', () => {
		expect(() => setup(processor('unknown'))).toThrow(/satteri\(\).*unified\(\)/);
	});

	test('injects the zoom module only when zoom is enabled', () => {
		expect(setup(processor('satteri'), { zoom: true })).toEqual([
			['page', 'import "astro-pele/zoom"'],
		]);
		expect(setup(processor('satteri'), { zoom: 'marked' })).toEqual([
			['page', 'import "astro-pele/zoom"'],
		]);
		expect(setup(processor('satteri'), { zoom: false })).toEqual([]);
	});

	test('does not inject a processor twice', () => {
		const markdownProcessor = processor('satteri');
		const integration = pele();
		setup(markdownProcessor, undefined, integration);
		setup(markdownProcessor, undefined, integration);
		setup(markdownProcessor, undefined, pele());

		expect(markdownProcessor.options.mdastPlugins).toHaveLength(1);
	});
});

describe('zoom module', () => {
	test('enables zoom on diagrams with the zoom marker', async () => {
		const enabled: object[] = [];
		const markedElement = {};
		let selector = '';
		const globalDocument = globalThis as { document?: unknown };
		const originalDocument = globalDocument.document;
		mock.module('pele/core', () => ({
			enableZoom: (element: object) => enabled.push(element),
		}));
		globalDocument.document = {
			querySelectorAll(value: string) {
				selector = value;
				return [markedElement];
			},
		};

		try {
			await import('../src/zoom.js');
			expect(selector).toBe('[data-pele-zoom]');
			expect(enabled).toEqual([markedElement]);
		} finally {
			if (originalDocument === undefined) delete globalDocument.document;
			else globalDocument.document = originalDocument;
		}
	});
});

describe('resolveOptions', () => {
	test('uses throw for builds and placeholder for dev and preview', () => {
		expect(resolveOptions('build', {})).toEqual({ errorMode: 'throw' });
		expect(resolveOptions('dev', {})).toEqual({ errorMode: 'placeholder' });
		expect(resolveOptions('preview', {})).toEqual({ errorMode: 'placeholder' });
		expect(resolveOptions('build', { errorMode: 'warn' })).toEqual({ errorMode: 'warn' });
	});
});
