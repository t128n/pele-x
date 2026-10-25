import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const rootPackage = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

describe('workspace foundation', () => {
	test('uses the expected workspaces and Bun version', () => {
		expect(rootPackage.workspaces).toEqual(['packages/*', 'apps/*', 'examples/*']);
		expect(rootPackage.packageManager).toBe('bun@1.4.3');
	});

	test('contains all three publishable package manifests', () => {
		for (const name of ['mdast', 'astro', 'starlight']) {
			const manifestPath = resolve(root, 'packages', name, 'package.json');
			expect(existsSync(manifestPath)).toBe(true);
			const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
			expect(manifest.name).toBe(`@pele-x/${name}`);
			expect(manifest.version).toBe('0.1.0');
			expect(manifest.private).toBe(true);
		}
	});

	test('maps mdast entry points to source for Astro typechecking', () => {
		const tsconfig = JSON.parse(
			readFileSync(resolve(root, 'packages/astro/tsconfig.json'), 'utf8'),
		);
		expect(tsconfig.compilerOptions.paths).toEqual({
			'@pele-x/mdast': ['../mdast/src/index.ts'],
			'@pele-x/mdast/remark': ['../mdast/src/remark.ts'],
			'@pele-x/mdast/satteri': ['../mdast/src/satteri.ts'],
		});
	});
});
