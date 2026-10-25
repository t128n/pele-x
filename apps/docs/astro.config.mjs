import starlight from '@astrojs/starlight';
import { starlightPele } from '@pele-x/starlight';
import { defineConfig } from 'astro/config';

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
