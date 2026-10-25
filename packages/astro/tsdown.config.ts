import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts', 'src/zoom.ts'],
	format: 'esm',
	dts: true,
	clean: true,
});
