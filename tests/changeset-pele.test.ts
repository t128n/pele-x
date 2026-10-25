import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const script = resolve(import.meta.dir, '../scripts/changeset-pele.mjs');

function run(version: string, cwd: string) {
	return spawnSync(process.execPath, [script, version], { cwd, encoding: 'utf8' });
}

describe('changeset-pele', () => {
	test('writes a patch changeset for all three packages', () => {
		const cwd = mkdtempSync(join(tmpdir(), 'changeset-pele-'));
		try {
			expect(run('1.11.0', cwd).status).toBe(0);
			expect(readFileSync(join(cwd, '.changeset/pele.md'), 'utf8')).toBe(
				"---\n'mdast-pele': patch\n'astro-pele': patch\n'starlight-pele': patch\n---\n\nUpdate Pele to 1.11.0.\n",
			);
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});

	test('rejects a non-semver version', () => {
		const cwd = mkdtempSync(join(tmpdir(), 'changeset-pele-'));
		try {
			const result = run('1.2', cwd);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('Usage:');
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});
});
