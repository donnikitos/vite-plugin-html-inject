import { defineConfig } from 'vite';
import injectHTML from '../../src';

export default defineConfig({
	plugins: [injectHTML()],
});
