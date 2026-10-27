import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	capture,
	listPackages,
	packPackage,
	readPackedManifest,
	run,
	workspaceRanges,
} from './packages';

interface PlanEntry {
	kind: 'publish' | 'tag';
	name: string;
	version: string;
	access?: string;
	tag?: string;
}

interface PublishPlan {
	version: 1;
	plan: PlanEntry[][];
}

const dryRun = process.argv.includes('--dry-run');
const packages = await listPackages();
const packagesByName = new Map(packages.map((pkg) => [pkg.name, pkg]));
const workDirectory = await mkdtemp(join(tmpdir(), 'pele-publish-'));
const planPath = join(workDirectory, 'plan.json');

async function createTag(entry: PlanEntry): Promise<void> {
	const name = `${entry.name}@${entry.version}`;
	const existing = await capture(['git', 'tag', '--list', name]);
	if (existing.trim() !== '') {
		console.log(`Tag ${name} already exists, skipping`);
		return;
	}
	await run(['git', 'tag', name]);
	console.log(`Tagged ${name}`);
}

async function publish(entry: PlanEntry): Promise<void> {
	const pkg = packagesByName.get(entry.name);
	if (pkg === undefined) throw new Error(`publish plan references unknown package ${entry.name}`);

	const packed = await packPackage(pkg);
	try {
		const manifest = await readPackedManifest(packed.tarball);
		if (manifest.version !== entry.version) {
			throw new Error(
				`${entry.name} packed as ${manifest.version}, expected ${entry.version}; run bun install to refresh bun.lock`,
			);
		}

		const ranges = workspaceRanges(manifest);
		if (ranges.length > 0) {
			const details = ranges.map(({ field, name, range }) => `${field}.${name}=${range}`);
			throw new Error(
				`${entry.name} still uses the workspace protocol: ${details.join(', ')}; run bun install to refresh bun.lock`,
			);
		}

		const access = entry.access ?? 'public';
		const tag = entry.tag ?? 'latest';
		const command = [
			'npm',
			'publish',
			packed.tarball,
			'--access',
			access,
			'--tag',
			tag,
			...(dryRun ? ['--dry-run'] : []),
		];
		console.log(`Publishing ${entry.name}@${entry.version} (${tag}, ${access})`);
		await run(command);
	} finally {
		await packed.cleanup();
	}

	if (!dryRun) await createTag(entry);
}

try {
	await run(['bunx', 'changeset', 'publish-plan', '--output', planPath]);
	const plan = JSON.parse(await readFile(planPath, 'utf8')) as PublishPlan;
	if (plan.version !== 1) throw new Error(`unsupported publish plan version ${plan.version}`);

	if (plan.plan.length === 0) {
		console.log('No packages to publish');
	} else {
		for (const chunk of plan.plan) {
			for (const entry of chunk) {
				if (entry.kind === 'publish') await publish(entry);
				else if (!dryRun) await createTag(entry);
			}
		}
	}
} finally {
	await rm(workDirectory, { recursive: true, force: true });
}
