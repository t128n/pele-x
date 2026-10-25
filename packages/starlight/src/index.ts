import type { StarlightPlugin } from '@astrojs/starlight/types';
import type { AstroPeleOptions } from '@pele-x/astro';
import { pele } from '@pele-x/astro';

export interface StarlightPeleOptions extends AstroPeleOptions {}

const theme = '@pele-x/starlight/theme.css';
const configured = new WeakSet<object>();

export function starlightPele(options: StarlightPeleOptions = {}): StarlightPlugin {
	return {
		name: '@pele-x/starlight',
		hooks: {
			'config:setup': ({ config, addIntegration, updateConfig }) => {
				if (!configured.has(config)) {
					addIntegration(pele(options));
					configured.add(config);
				}

				const customCss = config.customCss ?? [];
				if (!customCss.includes(theme)) {
					updateConfig({ customCss: [...customCss, theme] });
				}
			},
		},
	};
}
