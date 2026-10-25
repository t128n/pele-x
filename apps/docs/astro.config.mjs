import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { starlightPele } from 'starlight-pele';

export default defineConfig({
	site: 'https://pele-x.example.com',
	integrations: [
		starlight({
			title: 'Pele x',
			plugins: [starlightPele()],
			customCss: ['./src/styles/custom.css'],
		}),
	],
});
