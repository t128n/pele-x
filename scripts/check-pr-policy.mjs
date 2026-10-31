const conventionalTitle =
	/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9][a-z0-9._/-]*\))?!?: .+/;
const revertTitle = /^Revert ".+"/;
const conventionalBranch =
	/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)\/[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*$/;

const automationBranches = [
	/^changeset-release\//,
	/^renovate\//,
	/^pele\//,
	/^dependabot\//,
	/^copilot\//,
];

const title = process.env.PR_TITLE?.trim();
const headRef = process.env.HEAD_REF?.trim();
const headRepo = process.env.HEAD_REPO?.trim();
const baseRepo = process.env.BASE_REPO?.trim();
const errors = [];

if (!title) {
	errors.push('The pull request title is missing.');
} else if (!conventionalTitle.test(title) && !revertTitle.test(title)) {
	errors.push(
		`The pull request title must follow Conventional Commits, for example "feat: add support". Received: ${JSON.stringify(title)}`,
	);
}

// Rulesets cannot govern branch names in another repository's fork, so fork
// pull requests are exempt from the branch check.
const fromFork = headRepo !== undefined && baseRepo !== undefined && headRepo !== baseRepo;

if (!fromFork && headRef && !automationBranches.some((pattern) => pattern.test(headRef))) {
	if (!conventionalBranch.test(headRef)) {
		errors.push(
			`The branch name must use <type>/<slug> with one of feat, fix, docs, style, refactor, perf, test, build, ci, chore, or revert. Received: ${JSON.stringify(headRef)}`,
		);
	}
}

if (errors.length > 0) {
	console.error('Pull request policy check failed:\n');
	for (const error of errors) console.error(`- ${error}`);
	console.error(
		'\nAutomation branches matching changeset-release/, renovate/, pele/, dependabot/, or copilot/ are exempt from the branch check.',
	);
	process.exit(1);
}

console.log('Pull request title and branch name follow the repository conventions.');
