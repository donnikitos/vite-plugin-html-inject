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
		<load src="src/html/header/branding.html" />
		<!-- Loads index.html or index.htm file inside the specified directory -->
		<load src="src/html/header" />
		<div>
			<load src="src/html/body/sidebar.html" />
			<load src="src/html/body" />
		</div>
		<load src="src/html/footer" />
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
		src="src/some-static-link.htm"
		label="Go to DuckDuckGo"
		href="https://duckduckgo.com/"
	/>
	<load
		src="src/some-static-link.htm"
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

## Customization

You are able to customize the loader tag name and the source attribute name.\
For example a configuration like:

```js
injectHTML({
	tagName: 'loader', // Default is `load`
	sourceAttr: 'file', // Default is `src`
});
```

will replace:

```html
<!-- Load a HTML part -->
<loader
	file="src/some-static-link.htm"
	label="Go to DuckDuckGo"
	href="https://duckduckgo.com/"
/>
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

## Support

Love open source? Enjoying my project?\
Your support can keep the momentum going! Consider a donation to fuel the creation of more innovative open source software.

| via Ko-Fi                                                                         | Buy me a coffee                                                                                                                                                 | via PayPal                                                                                                                                                             |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y2ALMG) | <a href="https://www.buymeacoffee.com/donnikitos" target="_blank"><img src="https://nititech.de/donate-buymeacoffee.png" alt="Buy Me A Coffee" width="174"></a> | <a href="https://www.paypal.com/donate/?hosted_button_id=EPXZPRTR7JHDW" target="_blank"><img src="https://nititech.de/donate-paypal.png" alt="PayPal" width="174"></a> |
