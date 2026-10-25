import { render } from 'pele';
import { contextualError, escapeHtml, formatError } from './errors.js';
import { diagramId } from './id.js';
import type {
	FenceContext,
	FenceMeta,
	PelePluginOptions,
	RenderOptions,
	RenderResult,
} from './types.js';

const cacheLimit = 100;
const cache = new Map<string, string>();
const functionIds = new WeakMap<object, number>();
let nextFunctionId = 0;

function functionId(value: object): number {
	let id = functionIds.get(value);
	if (id === undefined) {
		id = ++nextFunctionId;
		functionIds.set(value, id);
	}
	return id;
}

function cacheKey(
	source: string,
	meta: FenceMeta,
	idPrefix: string,
	marked: boolean,
	options: RenderOptions,
): string | null {
	try {
		return JSON.stringify([source, meta.title, idPrefix, marked, options], (_key, value) => {
			if (typeof value === 'function') return `function:${functionId(value as object)}`;
			if (typeof value === 'bigint') return `bigint:${value.toString()}`;
			return value;
		});
	} catch {
		return null;
	}
}

function cached(key: string): string | undefined {
	const value = cache.get(key);
	if (value !== undefined) {
		cache.delete(key);
		cache.set(key, value);
	}
	return value;
}

function store(key: string, value: string): void {
	cache.set(key, value);
	if (cache.size > cacheLimit) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
}

export function renderDiagram(source: string, options?: RenderOptions): RenderResult {
	return render(source, options);
}

export function renderFenceToHtml(
	source: string,
	meta: FenceMeta,
	context: FenceContext,
	options?: PelePluginOptions,
): string {
	const errorMode = options?.errorMode ?? 'throw';
	const marked = options?.zoom === true || (options?.zoom === 'marked' && meta.zoom);
	const idPrefix = diagramId(context.fileURL, context.index, source);
	const renderOptions: PelePluginOptions = { ...options, idPrefix };
	delete renderOptions.languages;
	delete renderOptions.errorMode;
	delete renderOptions.zoom;
	const key = cacheKey(source, meta, idPrefix, marked, renderOptions);
	if (key !== null) {
		const hit = cached(key);
		if (hit !== undefined) return hit;
	}

	try {
		const { svg } = renderDiagram(source, renderOptions);
		const caption =
			meta.title === undefined ? '' : `<figcaption>${escapeHtml(meta.title)}</figcaption>`;
		const html = `<figure class="pele-diagram"${marked ? ' data-pele-zoom' : ''}>${svg}${caption}</figure>`;
		if (key !== null) store(key, html);
		return html;
	} catch (error) {
		const message = formatError(error, context);
		if (errorMode === 'warn') context.report?.(message);
		if (errorMode === 'throw') throw contextualError(error, context);
		return `<pre class="pele-error" role="alert">${escapeHtml(message)}</pre>`;
	}
}

export function clearRenderCache(): void {
	cache.clear();
}
