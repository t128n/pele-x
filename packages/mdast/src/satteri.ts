import type { MdastPluginDefinition } from 'satteri';
import { renderFenceToHtml } from './core.js';
import { isPeleLang, parseFenceMeta } from './meta.js';
import type { PelePluginOptions } from './types.js';

export function satteriPele(options?: PelePluginOptions): MdastPluginDefinition {
	return {
		name: 'pele',
		options: { position: true },
		code(node, ctx) {
			if (!isPeleLang(node.lang, options)) return;

			const html = renderFenceToHtml(
				node.value,
				parseFenceMeta(node.meta),
				{
					index: ctx.indexOf(node) ?? 0,
					fileURL: ctx.fileURL?.pathname,
					line: node.position?.start.line,
					report: (message) => ctx.report({ message, node, severity: 'warning' }),
				},
				options,
			);
			return { raw: html, mdxExpressions: false };
		},
	};
}
