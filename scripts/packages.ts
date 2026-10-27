import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const root = resolve(import.meta.dir, '..');

export const dependencyFields = [
	'dependencies',
	'devDependencies',
	'peerDependencies',
	'optionalDependencies',
] as const;

export type DependencyField = (typeof dependencyFields)[number];

export interface PackageManifest {
	name: string;
	version: string;
	private?: boolean;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
}

export interface WorkspacePackage extends PackageManifest {
	directory: string;
}

export interface PackedPackage {
	tarball: string;
	cleanup: () => Promise<void>;
}

export interface WorkspaceRange {
	field: DependencyField;
	name: string;
	range: string;
}

export async function run(command: string[], cwd = root): Promise<void> {
	const child = Bun.spawn({ cmd: command, cwd, stdout: 'inherit', stderr: 'inherit' });
	const exitCode = await child.exited;
	if (exitCode !== 0) throw new Error(`${command.join(' ')} failed with exit code ${exitCode}`);
}

export async function capture(command: string[], cwd = root): Promise<string> {
	const child = Bun.spawn({ cmd: command, cwd, stdout: 'pipe', stderr: 'pipe' });
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	if (exitCode !== 0) {
		throw new Error(
			`${command.join(' ')} failed with exit code ${exitCode}: ${stderr.trim() || stdout.trim()}`,
		);
	}
	return stdout;
}

export async function listPackages(): Promise<WorkspacePackage[]> {
	const rootManifest = (await Bun.file(resolve(root, 'package.json')).json()) as {
		workspaces?: string[];
	};
	const seen = new Set<string>();
	const packages: WorkspacePackage[] = [];

	for (const pattern of rootManifest.workspaces ?? []) {
		const glob = new Bun.Glob(`${pattern}/package.json`);
		for await (const path of glob.scan({ cwd: root })) {
			if (seen.has(path)) continue;
			seen.add(path);
			const directory = resolve(root, path, '..');
			const manifest = (await Bun.file(resolve(root, path)).json()) as PackageManifest;
			packages.push({ ...manifest, directory });
		}
	}

	return packages.sort((a, b) => a.name.localeCompare(b.name));
}

export async function packPackage(pkg: WorkspacePackage): Promise<PackedPackage> {
	const destination = await mkdtemp(join(tmpdir(), 'pele-pack-'));
	await run(
		['bun', 'pm', 'pack', '--destination', destination, '--ignore-scripts', '--quiet'],
		pkg.directory,
	);
	const tarballs = (await readdir(destination)).filter((entry) => entry.endsWith('.tgz'));
	if (tarballs.length !== 1) {
		await rm(destination, { recursive: true, force: true });
		throw new Error(`expected one tarball for ${pkg.name}, found ${tarballs.length}`);
	}
	return {
		tarball: join(destination, tarballs[0]),
		cleanup: () => rm(destination, { recursive: true, force: true }),
	};
}

export async function readPackedManifest(tarball: string): Promise<PackageManifest> {
	const stdout = await capture(['tar', '-xzOf', tarball, 'package/package.json']);
	return JSON.parse(stdout) as PackageManifest;
}

export function workspaceRanges(manifest: PackageManifest): WorkspaceRange[] {
	const ranges: WorkspaceRange[] = [];
	for (const field of dependencyFields) {
		for (const [name, range] of Object.entries(manifest[field] ?? {})) {
			if (range.startsWith('workspace:')) ranges.push({ field, name, range });
		}
	}
	return ranges;
}
