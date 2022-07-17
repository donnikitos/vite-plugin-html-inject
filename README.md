# vite-plugin-html-inject

[![npm](https://img.shields.io/npm/dt/vite-plugin-html-inject?style=for-the-badge)](https://www.npmjs.com/package/vite-plugin-html-inject) ![GitHub Repo stars](https://img.shields.io/github/stars/donnikitos/vite-plugin-html-inject?label=GitHub%20Stars&style=for-the-badge) [![GitHub](https://img.shields.io/github/license/donnikitos/vite-plugin-html-inject?color=blue&style=for-the-badge)](https://github.com/donnikitos/vite-plugin-html-inject/blob/master/LICENSE)
![GitHub last commit](https://img.shields.io/github/last-commit/donnikitos/vite-plugin-html-inject?style=for-the-badge) [![Issues](https://img.shields.io/github/issues/donnikitos/vite-plugin-html-inject?style=for-the-badge)](https://github.com/donnikitos/vite-plugin-html-inject/issues)

Split your `index.html` into smaller, reusable static HTML pieces.

```js
// vite.config.js
import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
	plugins: [injectHTML()],
});
```

## Load those sweet separate HTML files

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	</head>
	<body>
		<!-- Loads the specified .html file -->
		<load ="src/html/header/branding.html" />
		<!-- Loads index.html or index.htm file inside the specified directory -->
		<load ="src/html/header" />
		<div>
			<load ="src/html/body/sidebar.html" />
			<load ="src/html/body" />
		</div>
		<load ="src/html/footer" />
	</body>
</html>
```

## Pass down static arguments to injected HTML parts

The plugin also allows you to supply your HTML parts with some basic arguments, so you can reuse the same piece of code in multiple places.

For example you can reuse a similarly styled link somewhere in your `index.html`:

```html
<!-- index.html -->
...
<div class="some-cool-menu">
	<!-- Load a HTML part -->
	<load
		="src/some-static-link.htm"
		label="Go to DuckDuckGo"
		href="https://duckduckgo.com/"
	/>
	<load
		="src/some-static-link.htm"
		label="Go to Google"
		href="https://google.com"
	/>
</div>
...
```

And that `src/some-static-link.htm`:

```html
<!-- src/some-static-link.htm -->
<a href="{=$href}" class="some-cool-link-style">{=$label}</a>
```

This will result in a dev and runtime generated index.html looking like

```html
<!-- generated index.html -->
...
<div class="some-cool-menu">
	<!-- Load a HTML part -->
	<a href="https://duckduckgo.com/" class="some-cool-link-style">
		Go to DuckDuckGo
	</a>
	<a href="https://google.com" class="some-cool-link-style">Go to Google</a>
</div>
...
```

## Debugging

By default the debugging option is turned off. However, if you encounter issues loading files, you can turn on path logging.

```js
injectHTML({
	debug: {
		logPath: true,
	},
});
```
