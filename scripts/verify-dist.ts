import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const packages = [
	{ name: '@pele-x/mdast', directory: 'mdast', exports: ['./remark', './satteri'] },
	{ name: '@pele-x/astro', directory: 'astro', exports: ['./zoom', './Pele.astro', './theme.css'] },
	{ name: '@pele-x/starlight', directory: 'starlight', exports: ['./theme.css'] },
] as const;

let failures = 0;

async function check(label: string, action: () => void | Promise<void>): Promise<void> {
	try {
		await action();
		console.log(`PASS ${label}`);
	} catch (error) {
		failures++;
		const message = error instanceof Error ? error.message : String(error);
		console.error(`FAIL ${label}: ${message}`);
	}
}

async function assertFile(path: string): Promise<void> {
	if (!(await Bun.file(path).exists())) throw new Error(`missing ${path}`);
}

async function run(command: string[]): Promise<void> {
	const child = Bun.spawn({ cmd: command, cwd: root, stdout: 'inherit', stderr: 'inherit' });
	const exitCode = await child.exited;
	if (exitCode !== 0) throw new Error(`exit code ${exitCode}`);
}

function targets(value: unknown): string[] {
	if (typeof value === 'string') return [value];
	if (value !== null && typeof value === 'object') {
		return Object.values(value).flatMap((entry) => targets(entry));
	}
	return [];
}

export async function verifyDist(): Promise<void> {
	failures = 0;
	for (const pkg of packages) {
		const relativeDirectory = `packages/${pkg.directory}`;
		const directory = resolve(root, relativeDirectory);
		await check(`${pkg.name} dist/index.js`, () => assertFile(resolve(directory, 'dist/index.js')));
		await check(`${pkg.name} dist/index.d.ts`, () =>
			assertFile(resolve(directory, 'dist/index.d.ts')),
		);

		const manifest = (await Bun.file(resolve(directory, 'package.json')).json()) as {
			exports?: Record<string, unknown>;
		};
		for (const subpath of pkg.exports) {
			await check(`${pkg.name} export ${subpath}`, async () => {
				const entry = manifest.exports?.[subpath];
				if (entry === undefined) throw new Error('export is not defined');
				const exportTargets = targets(entry);
				if (exportTargets.length === 0) throw new Error('export has no file targets');
				for (const target of exportTargets) await assertFile(resolve(directory, target));
			});
		}

		await check(`${pkg.name} publint`, () => run(['bunx', 'publint', relativeDirectory]));
		await check(`${pkg.name} attw`, () => run(['bunx', 'attw', '--pack', relativeDirectory]));
		await check(`${pkg.name} Node import`, () =>
			run(['node', '--input-type=module', '-e', `await import('${pkg.name}')`]),
		);
	}

	if (failures > 0) throw new Error(`${failures} package verification check(s) failed`);
}

await verifyDist();
