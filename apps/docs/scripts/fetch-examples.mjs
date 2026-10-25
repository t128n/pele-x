import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXAMPLES_URL = 'https://pele.run/examples.md';
const TARGET = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'src',
	'content',
	'docs',
	'reference',
	'examples.mdx',
);

const FRONTMATTER = `---
title: Diagram examples
description: A gallery of Pele diagram types mirrored from pele.run.
sidebar:
  order: 3
---
`;

async function fetchExamples() {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 30_000);

	try {
		const response = await fetch(EXAMPLES_URL, { signal: controller.signal });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		return await response.text();
	} finally {
		clearTimeout(timeout);
	}
}

function stripFrontmatter(source) {
	if (source.startsWith('---')) {
		const end = source.indexOf('\n---', 3);
		if (end !== -1) {
			return source.slice(end + 4).replace(/^\n+/, '');
		}
	}
	return source;
}

function rewriteLinks(source) {
	// Turn pele.run relative /examples/* links into absolute URLs.
	return source.replaceAll('](/examples/', '](https://pele.run/examples/');
}

async function main() {
	const source = await fetchExamples();
	const body = rewriteLinks(stripFrontmatter(source));
	const content = `${FRONTMATTER.trim()}\n\n${body}`;

	await mkdir(dirname(TARGET), { recursive: true });
	await writeFile(TARGET, content, 'utf8');
	console.log(`Mirrored ${EXAMPLES_URL} to ${TARGET}`);
}

main().catch((error) => {
	console.error(`Failed to mirror examples: ${error.message}`);
	process.exitCode = 1;
});
