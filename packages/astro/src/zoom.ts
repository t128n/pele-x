import { enableZoom } from 'pele/core';

type ZoomElement = Parameters<typeof enableZoom>[0];
const zoomDocument = (
	globalThis as {
		document?: { querySelectorAll(selector: string): Iterable<ZoomElement> };
	}
).document;

for (const element of zoomDocument?.querySelectorAll('[data-pele-zoom]') ?? []) {
	enableZoom(element);
}
