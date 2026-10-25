import type { AstroIntegration } from 'astro';
import type { PelePluginOptions } from 'mdast-pele';
import { remarkPele } from 'mdast-pele/remark';
import { satteriPele } from 'mdast-pele/satteri';

export interface AstroPeleOptions extends PelePluginOptions {}

interface MarkdownProcessor {
	name?: string;
	options: {
		mdastPlugins?: unknown[];
		remarkPlugins?: unknown[];
	};
}

const injectedProcessors = new WeakSet<object>();

function unsupportedProcessor(): Error {
	return new Error('Unsupported Markdown processor. Configure Astro with satteri() or unified().');
}

export function resolveOptions(
	command: 'dev' | 'build' | 'preview',
	options: AstroPeleOptions = {},
): AstroPeleOptions {
	return {
		...options,
		errorMode: options.errorMode ?? (command === 'build' ? 'throw' : 'placeholder'),
	};
}

export function pele(options: AstroPeleOptions = {}): AstroIntegration {
	return {
		name: 'astro-pele',
		hooks: {
			'astro:config:setup': ({ config, command, injectScript }) => {
				const resolved = resolveOptions(command === 'sync' ? 'build' : command, options);
				const processor = config.markdown.processor as MarkdownProcessor | undefined;
				if (!processor) throw unsupportedProcessor();

				if (!injectedProcessors.has(processor)) {
					if (processor.name === 'satteri') {
						processor.options.mdastPlugins ??= [];
						processor.options.mdastPlugins.push(satteriPele(resolved));
					} else if (processor.name === 'unified') {
						processor.options.remarkPlugins ??= [];
						processor.options.remarkPlugins.push([remarkPele, resolved]);
					} else {
						throw unsupportedProcessor();
					}
					injectedProcessors.add(processor);
				}

				if (resolved.zoom) injectScript('page', 'import "astro-pele/zoom"');
			},
		},
	};
}
