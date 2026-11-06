import path from 'path';
import {
	IndexHtmlTransformHook,
	normalizePath,
	ResolvedConfig,
	resolveEnvPrefix,
} from 'vite';

/**
 * Support `%ENV_NAME%` syntax in html files
 * @description Taken from vite/src/node/plugins/html.ts
 * @link https://github.com/vitejs/vite/blob/c9e086d35ac35ee1c6d85d48369e8a67a2ba6bfe/packages/vite/src/node/plugins/html.ts#L1194
 */
export default function htmlEnvHook(
	config: ResolvedConfig,
): IndexHtmlTransformHook {
	const pattern = /%(\S+?)%/g;
	const envPrefix = resolveEnvPrefix({ envPrefix: config.envPrefix });
	const env: Record<string, any> = { ...config.env };

	// account for user env defines
	for (const key in config.define) {
		if (key.startsWith(`import.meta.env.`)) {
			const val = config.define[key];
			if (typeof val === 'string') {
				try {
					const parsed = JSON.parse(val);
					env[key.slice(16)] = typeof parsed === 'string' ? parsed : val;
				} catch {
					env[key.slice(16)] = val;
				}
			} else {
				env[key.slice(16)] = JSON.stringify(val);
			}
		}
	}
	return (html, ctx) => {
		return html.replace(pattern, (text, key) => {
			if (key in env) {
				return env[key];
			} else {
				if (envPrefix.some((prefix) => key.startsWith(prefix))) {
					const relativeHtml = normalizePath(
						path.relative(config.root, ctx.filename),
					);
					config.logger.warn(
						`(!) ${text} is not defined in env variables found in /${relativeHtml}. Is the variable mistyped?`,
					);
				}

				return text;
			}
		});
	};
}
