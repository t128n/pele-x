import type { RenderOptions, RenderResult } from 'pele';

export type { RenderOptions, RenderResult };

export type ErrorMode = 'throw' | 'placeholder' | 'warn';

export interface PelePluginOptions extends RenderOptions {
	languages?: readonly string[];
	errorMode?: ErrorMode;
	zoom?: boolean | 'marked';
}

export interface FenceMeta {
	title?: string;
	zoom: boolean;
}

export interface FenceContext {
	index: number;
	fileURL?: string;
	line?: number;
	report?: (message: string) => void;
}
