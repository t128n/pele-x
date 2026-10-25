import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const version = process.argv[2];
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

if (!version || !semver.test(version)) {
	console.error('Usage: node scripts/changeset-pele.mjs <version>');
	process.exit(1);
}

const contents = `---
'mdast-pele': patch
'astro-pele': patch
'starlight-pele': patch
---

Update Pele to ${version}.
`;

mkdirSync('.changeset', { recursive: true });

const file = join('.changeset', 'pele.md');
writeFileSync(file, contents);
console.log(`Wrote ${file}`);
