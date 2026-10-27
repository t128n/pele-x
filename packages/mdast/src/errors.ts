import { PeleError } from 'pele';
import type { FenceContext } from './types.js';

export function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => {
		switch (character) {
			case '&':
				return '&amp;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '"':
				return '&quot;';
			default:
				return '&#39;';
		}
	});
}

export function formatError(error: unknown, context: FenceContext): string {
	const message = error instanceof Error ? error.message : String(error);
	// Pele reports 1-based lines inside the fence body; `context.line` is the fence's opening line.
	const errorLine = error instanceof PeleError && error.line > 0 ? error.line : undefined;
	const line =
		context.line !== undefined && errorLine !== undefined
			? context.line + errorLine
			: (context.line ?? errorLine);
	const location = context.fileURL
		? `${context.fileURL}${line === undefined ? '' : `:${line}`}`
		: line === undefined
			? ''
			: `line ${line}`;
	return location ? `${location}: ${message}` : message;
}

export function contextualError(error: unknown, context: FenceContext): Error {
	const message = formatError(error, context);
	if (error instanceof PeleError) {
		return new PeleError(message, error.code, {
			type: error.type,
			mermaidType: error.mermaidType,
			line: error.line,
			column: error.column,
			snippet: error.snippet,
		});
	}
	return new Error(message, { cause: error });
}
