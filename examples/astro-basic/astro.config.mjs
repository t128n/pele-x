import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import { pele } from '@pele-x/astro';
import { defineConfig } from 'astro/config';

const markdown = process.env.PELE_PROCESSOR === 'unified' ? { processor: unified() } : {};

export default defineConfig({
	markdown,
	integrations: [mdx(), pele({ zoom: process.env.PELE_ZOOM === 'marked' ? 'marked' : false })],
});
