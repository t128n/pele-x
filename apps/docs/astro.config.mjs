import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { starlightPele } from 'starlight-pele';

export default defineConfig({
	site: 'https://t128n.github.io',
	base: '/pele-x',
	integrations: [
		starlight({
			title: 'Pele x',
			plugins: [starlightPele()],
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{ label: 'Pele x', link: '/' },
				{
					label: 'Tutorial',
					items: [{ label: 'Getting started', slug: 'tutorial/getting-started' }],
				},
				{
					label: 'How-to guides',
					items: [
						{ label: 'Installation', slug: 'how-to/install' },
						{ label: 'Authoring diagrams', slug: 'how-to/authoring' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Starlight plugin', slug: 'reference/starlight' },
						{ label: 'Astro integration', slug: 'reference/astro' },
						{ label: 'Diagram examples', slug: 'reference/examples' },
						{ label: 'Theming', slug: 'reference/theming' },
					],
				},
				{
					label: 'Explanation',
					items: [{ label: 'Troubleshooting', slug: 'explanation/troubleshooting' }],
				},
			],
		}),
	],
});
