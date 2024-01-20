import { normalizePath, Plugin, ResolvedConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const attrNameExpr = '[a-z0-9_-]+';
const attrDataExpr = '[^"]*';

const tagMatcher = new RegExp(
	`<load((?:\\s{1,}(${attrNameExpr}|)="${attrDataExpr}")+)\\s*/>`,
	'gsi',
);
const attrMatcher = new RegExp(`(${attrNameExpr}|)="(${attrDataExpr})"`, 'gsi');
const replaceAttrMatcher = new RegExp(`{=\\$${attrNameExpr}}`, 'gsi');

function escapeRegExp(input: string) {
	return input.replace(/[.*+?^${}()|[\]\\]/g, '$&');
}

type InjectHTMLConfig = {
	replace?: { undefined?: string };
	debug?: { logPath?: boolean };
};

function injectHTML(pluginConfig?: InjectHTMLConfig): Plugin {
	const cfg = { ...pluginConfig };

	let config: undefined | ResolvedConfig;

	const fileList = new Set<string>();

	async function renderSnippets(code: string, codePath: string) {
		if (!config) {
			return code;
		}

		const matches = code.matchAll(tagMatcher);

		for (const match of matches) {
			let [tag, _attrs] = match;

			const attrs = new Map();
			for (const [, name, value] of _attrs.trim().matchAll(attrMatcher)) {
				attrs.set(name || 'src', value);
			}

			let url = attrs.get('src');

			let root = config.root;

			if (url.startsWith('.')) {
				root = path.dirname(root + codePath);
			} else {
				url = '/' + url;
			}

			if (!(url.endsWith('.htm') || url.endsWith('.html'))) {
				['html', 'htm'].some((item) => {
					const fileName = '/index.' + item;

					const filePath = normalizePath(
						path.join(root, url, fileName),
					);

					if (fs.existsSync(filePath)) {
						url += fileName;

						return true;
					}
				});
			}

			const filePath = normalizePath(path.join(root, url));
			if (pluginConfig?.debug?.logPath) {
				console.log('Trying to include ', filePath);
			}
			fileList.add(filePath);

			let out = tag;
			try {
				let data = fs.readFileSync(filePath, 'utf8');

				for (const [name, value] of attrs) {
					const attrRegExp = new RegExp(
						'{=\\$' + escapeRegExp(name) + '}',
						'gs',
					);
					// ^ Node version below 15.0 has no .replaceAll()

					data = data.replace(attrRegExp, value);
				}

				if (cfg.replace?.undefined) {
					data = data.replace(
						replaceAttrMatcher,
						cfg.replace.undefined,
					);
				}

				out = await renderSnippets(data, url);
			} catch (error) {
				if (error instanceof Error) {
					out = error.message;
				}
				console.error(out);
			}

			code = code.replace(tag, out);
		}

		return code;
	}

	return {
		name: 'static-html-loader',
		configResolved(resolvedConfig) {
			config = resolvedConfig;
		},
		handleHotUpdate({ file, server }) {
			if (fileList.has(file)) {
				server.ws.send({
					type: 'full-reload',
					path: '*',
				});
			}
		},
		transformIndexHtml: {
			enforce: 'pre',
			transform(html, ctx) {
				return renderSnippets(html, ctx.path);
			},
		},
	};
}

export default injectHTML;
