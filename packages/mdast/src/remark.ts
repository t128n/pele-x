import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';
import { renderFenceToHtml } from './core.js';
import { isPeleLang, parseFenceMeta } from './meta.js';
import type { PelePluginOptions } from './types.js';

export type RemarkTransformer = (tree: Root, file?: { path?: string; history?: string[] }) => void;

export function remarkPele(options?: PelePluginOptions): RemarkTransformer {
	return (tree, file) => {
		const fileURL = file?.path ?? file?.history?.[0];
		visit(tree, 'code', (node, index, parent) => {
			if (index == null || !parent || !isPeleLang(node.lang, options)) return;

			const value = renderFenceToHtml(
				node.value,
				parseFenceMeta(node.meta),
				{ index, fileURL, line: node.position?.start.line },
				options,
			);
			parent.children[index] = { type: 'html', value, position: node.position };
		});
	};
}
