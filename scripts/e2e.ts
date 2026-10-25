import { readdir, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const example = resolve(root, 'examples/astro-basic');
const exampleDist = resolve(example, 'dist');

async function build(
	cwd: string,
	label: string,
	overrides: Record<string, string> = {},
): Promise<void> {
	const env = { ...Bun.env };
	delete env.PELE_PROCESSOR;
	delete env.PELE_ZOOM;
	Object.assign(env, overrides);
	const child = Bun.spawn(['bun', 'run', 'build'], {
		cwd,
		env,
		stdin: 'ignore',
		stdout: 'inherit',
		stderr: 'inherit',
	});
	if ((await child.exited) !== 0) throw new Error(`${label} build failed`);
}

async function contents(path: string): Promise<string> {
	try {
		return await readFile(path, 'utf8');
	} catch (error) {
		throw new Error(`Unable to read ${path}`, { cause: error });
	}
}

async function expectText(path: string, text: string): Promise<void> {
	if (!(await contents(path)).includes(text))
		throw new Error(`Expected ${path} to contain ${text}`);
}

async function buildExample(label: string, env?: Record<string, string>): Promise<void> {
	await rm(exampleDist, { recursive: true, force: true });
	await build(example, label, env);
}

async function main(): Promise<void> {
	await build(root, 'Package');

	await buildExample('Default Sätteri');
	const defaultIndex = resolve(exampleDist, 'index.html');
	await expectText(defaultIndex, '<svg');
	if ((await contents(defaultIndex)).includes('data-pele-zoom')) {
		throw new Error('Default build unexpectedly contains data-pele-zoom');
	}
	const mdxPage = resolve(exampleDist, 'mdx/index.html');
	await expectText(mdxPage, 'Works?');
	await expectText(mdxPage, '<svg');

	await buildExample('Unified', { PELE_PROCESSOR: 'unified' });
	await expectText(resolve(exampleDist, 'index.html'), '<svg');

	await buildExample('Marked zoom', { PELE_ZOOM: 'marked' });
	await expectText(resolve(exampleDist, 'zoom/index.html'), 'data-pele-zoom');
	const assets = resolve(exampleDist, '_astro');
	const files = await readdir(assets, { withFileTypes: true });
	let zoomChunk = false;
	for (const file of files) {
		if (file.isFile() && file.name.endsWith('.js')) {
			if ((await contents(resolve(assets, file.name))).includes('data-pele-zoom')) zoomChunk = true;
		}
	}
	if (!zoomChunk) throw new Error('No built JavaScript chunk contains data-pele-zoom');

	const docs = resolve(root, 'apps/docs');
	await build(docs, 'Documentation');
	await expectText(resolve(docs, 'dist/index.html'), '<svg');
	console.log('E2E checks passed');
}

main().catch((error: unknown) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`E2E failed: ${message}`);
	process.exitCode = 1;
});
