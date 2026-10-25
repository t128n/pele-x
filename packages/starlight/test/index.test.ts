import { describe, expect, test } from 'bun:test';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import type { AstroIntegration } from 'astro';
import { starlightPele } from '../src/index.js';

type SetupOptions = Parameters<NonNullable<StarlightPlugin['hooks']['config:setup']>>[0];
const theme = 'starlight-pele/theme.css';

function setup(
	plugin: StarlightPlugin,
	config: { customCss: string[] },
	integrations: AstroIntegration[],
): void {
	const hook = plugin.hooks['config:setup'];
	if (!hook) throw new Error('Missing config:setup hook');
	hook({
		config,
		addIntegration: (integration: AstroIntegration) => integrations.push(integration),
		updateConfig: (update: { customCss?: string[] }) => {
			if (update.customCss) config.customCss = update.customCss;
		},
	} as unknown as SetupOptions);
}

describe('starlightPele', () => {
	test('adds the Astro integration and appends its theme', () => {
		const config = { customCss: ['./custom.css'] };
		const integrations: AstroIntegration[] = [];
		const plugin = starlightPele();
		setup(plugin, config, integrations);

		expect(plugin.name).toBe('starlight-pele');
		expect(integrations.map((integration) => integration.name)).toEqual(['astro-pele']);
		expect(config.customCss.at(-1)).toBe(theme);
	});

	test('does not duplicate the integration or theme on repeated setup', () => {
		const config = { customCss: [] };
		const integrations: AstroIntegration[] = [];
		const plugin = starlightPele();
		setup(plugin, config, integrations);
		setup(plugin, config, integrations);

		expect(integrations).toHaveLength(1);
		expect(config.customCss.filter((entry) => entry === theme)).toHaveLength(1);
	});
});
