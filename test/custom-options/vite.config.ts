import { defineConfig } from 'vite';
import injectHTML from '../../src';

export default defineConfig({
	plugins: [
		injectHTML({
			tagName: 'include',
			sourceAttr: 'file',
			replace: { undefined: '(not supplied)' },
			debug: { logPath: true },
		}),
	],
});
