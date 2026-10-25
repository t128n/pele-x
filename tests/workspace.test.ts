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
		const names = {
			mdast: 'mdast-pele',
			astro: 'astro-pele',
			starlight: 'starlight-pele',
		};
		for (const [directory, name] of Object.entries(names)) {
			const manifestPath = resolve(root, 'packages', directory, 'package.json');
			expect(existsSync(manifestPath)).toBe(true);
			const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
			expect(manifest.name).toBe(name);
			expect(manifest.version).toBe('0.1.0');
			expect(manifest.private).not.toBe(true);
			expect(manifest.publishConfig).toEqual({ access: 'public' });
		}
	});

	test('maps mdast entry points to source for Astro typechecking', () => {
		const tsconfig = JSON.parse(
			readFileSync(resolve(root, 'packages/astro/tsconfig.json'), 'utf8'),
		);
		expect(tsconfig.compilerOptions.paths).toEqual({
			'mdast-pele': ['../mdast/src/index.ts'],
			'mdast-pele/remark': ['../mdast/src/remark.ts'],
			'mdast-pele/satteri': ['../mdast/src/satteri.ts'],
		});
	});
});
