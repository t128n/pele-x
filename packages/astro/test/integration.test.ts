import { describe, expect, test } from 'bun:test';
import type { AstroIntegration } from 'astro';
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
	});

	test('rejects unknown processors with a useful error', () => {
		expect(() => setup(processor('unknown'))).toThrow(/satteri\(\).*unified\(\)/);
	});

	test('injects the zoom module only when zoom is enabled', () => {
		expect(setup(processor('satteri'), { zoom: true })).toEqual([
			['page', 'import "@pele-x/astro/zoom"'],
		]);
		expect(setup(processor('satteri'), { zoom: false })).toEqual([]);
	});

	test('does not inject a processor twice', () => {
		const markdownProcessor = processor('satteri');
		const integration = pele();
		setup(markdownProcessor, undefined, integration);
		setup(markdownProcessor, undefined, integration);

		expect(markdownProcessor.options.mdastPlugins).toHaveLength(1);
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
