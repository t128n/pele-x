import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { starlightPele } from 'starlight-pele';

const base = '/pele-x';

export default defineConfig({
	site: 'https://t128n.github.io',
	base,
	redirects: {
		'/tutorial/getting-started-starlight': `${base}/guides/getting-started-starlight/`,
		'/tutorial/getting-started-astro': `${base}/guides/getting-started-astro/`,
		'/how-to/install': `${base}/guides/choose-integration/`,
		'/how-to/authoring': `${base}/guides/authoring/`,
	},
	integrations: [
		starlight({
			title: 'pele-x',
			plugins: [starlightPele()],
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{ label: 'pele-x', link: '/' },
				{
					label: 'Guides',
					items: [
						{ label: 'Choose an integration', slug: 'guides/choose-integration' },
						{ label: 'Get started with Starlight', slug: 'guides/getting-started-starlight' },
						{ label: 'Get started with Astro', slug: 'guides/getting-started-astro' },
						{ label: 'Get started with mdast', slug: 'guides/getting-started-mdast' },
						{ label: 'Authoring diagrams', slug: 'guides/authoring' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'Starlight plugin', slug: 'reference/starlight' },
						{ label: 'Astro integration', slug: 'reference/astro' },
						{ label: 'mdast-pele plugin', slug: 'reference/mdast' },
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
