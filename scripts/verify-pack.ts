import {
	listPackages,
	packPackage,
	readPackedManifest,
	workspaceRanges,
	type WorkspacePackage,
} from './packages';

const publishedDependencyFields = [
	'dependencies',
	'peerDependencies',
	'optionalDependencies',
] as const;

const packages = await listPackages();
const packagesByName = new Map(packages.map((pkg) => [pkg.name, pkg]));

let failures = 0;

async function check(label: string, action: () => Promise<void>): Promise<void> {
	try {
		await action();
		console.log(`PASS ${label}`);
	} catch (error) {
		failures++;
		const message = error instanceof Error ? error.message : String(error);
		console.error(`FAIL ${label}: ${message}`);
	}
}

async function verifyPackage(pkg: WorkspacePackage): Promise<void> {
	const packed = await packPackage(pkg);
	try {
		const manifest = await readPackedManifest(packed.tarball);

		if (manifest.version !== pkg.version) {
			throw new Error(
				`packed version ${manifest.version} does not match workspace version ${pkg.version}; run bun install to refresh bun.lock`,
			);
		}

		const ranges = workspaceRanges(manifest);
		if (ranges.length > 0) {
			const details = ranges.map(({ field, name, range }) => `${field}.${name}=${range}`);
			throw new Error(`packed manifest still uses the workspace protocol: ${details.join(', ')}`);
		}

		for (const field of publishedDependencyFields) {
			for (const [name, range] of Object.entries(manifest[field] ?? {})) {
				const dependency = packagesByName.get(name);
				if (dependency === undefined) continue;
				if (range !== dependency.version) {
					throw new Error(
						`${field}.${name} is ${range}, expected ${dependency.version}; run bun install to refresh bun.lock`,
					);
				}
			}
		}
	} finally {
		await packed.cleanup();
	}
}

for (const pkg of packages) {
	if (pkg.private) continue;
	await check(pkg.name, () => verifyPackage(pkg));
}

if (failures > 0) {
	console.error(`${failures} package pack check(s) failed`);
	process.exit(1);
}
