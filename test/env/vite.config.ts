import { defineConfig } from 'vite';
import injectHTML from '../../src';

export default defineConfig({
	plugins: [injectHTML()],
	define: {
		'import.meta.env.DEFINED_MESSAGE': JSON.stringify('Message from define'),
		'import.meta.env.CUSTOM_FILE': JSON.stringify('custom'),
	},
});
