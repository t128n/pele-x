import type { FenceMeta, PelePluginOptions } from './types.js';

const titlePattern = /(?:^|\s)title\s*=\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')/;
const quotedPattern = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
const zoomPattern = /(?:^|\s)zoom(?=\s|$)/;
const defaultLanguages = ['mermaid', 'pele'];

export function parseFenceMeta(meta: string | null | undefined): FenceMeta {
	if (!meta) return { zoom: false };

	const titleMatch = titlePattern.exec(meta);
	const title = titleMatch?.[1] ?? titleMatch?.[2];
	const unquoted = meta.replace(quotedPattern, '');
	const result: FenceMeta = { zoom: zoomPattern.test(unquoted) };

	if (title !== undefined) result.title = title.replace(/\\(["'\\])/g, '$1');
	return result;
}

export function isPeleLang(lang: string | null | undefined, options?: PelePluginOptions): boolean {
	return lang != null && (options?.languages ?? defaultLanguages).includes(lang);
}
