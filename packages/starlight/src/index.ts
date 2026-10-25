import type { StarlightPlugin } from '@astrojs/starlight/types';
import type { AstroPeleOptions } from 'astro-pele';
import { pele } from 'astro-pele';

export interface StarlightPeleOptions extends AstroPeleOptions {}

const theme = 'starlight-pele/theme.css';
const configured = new WeakSet<object>();

export function starlightPele(options: StarlightPeleOptions = {}): StarlightPlugin {
	return {
		name: 'starlight-pele',
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
