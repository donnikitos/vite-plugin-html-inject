import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build, createServer, type Rollup } from 'vite';
import injectHTML from '../src/index';

type Options = Parameters<typeof injectHTML>[0];
type Files = Record<string, string>;

const tempDirs: string[] = [];

afterEach(() => {
	for (const dir of tempDirs.splice(0)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

/** Creates a throw-away Vite project containing `files`. */
function createProject(files: Files) {
	// realpath: on macOS the tmp dir is a symlink, which confuses Vite.
	const root = fs.realpathSync(
		fs.mkdtempSync(path.join(os.tmpdir(), 'html-inject-')),
	);
	tempDirs.push(root);

	for (const [name, content] of Object.entries(files)) {
		const file = path.join(root, name);
		fs.mkdirSync(path.dirname(file), { recursive: true });
		fs.writeFileSync(file, content);
	}

	return root;
}

/** Runs a real `vite build` and returns the generated index.html. */
async function renderBuild(files: Files, options?: Options) {
	const root = createProject(files);

	const result = (await build({
		root,
		configFile: false,
		logLevel: 'silent',
		plugins: [injectHTML(options)],
		build: { write: false },
	})) as Rollup.RollupOutput;

	const html = result.output.find((item) => item.fileName === 'index.html');
	if (!html || html.type !== 'asset') {
		throw new Error('index.html not found in build output');
	}

	return String(html.source);
}

describe('loading files', () => {
	it('injects a file by its path', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="src/header.html" /></body>',
			'src/header.html': '<header>Hello</header>',
		});

		expect(html).toContain('<body><header>Hello</header></body>');
		expect(html).not.toContain('<load');
	});

	it('injects the index.html of a directory', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="src/footer" /></body>',
			'src/footer/index.html': '<footer>Footer</footer>',
		});

		expect(html).toContain('<footer>Footer</footer>');
	});

	it('injects the index.htm of a directory', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="src/footer" /></body>',
			'src/footer/index.htm': '<footer>Old school</footer>',
		});

		expect(html).toContain('<footer>Old school</footer>');
	});

	it('injects multiple tags in the same file', async () => {
		const html = await renderBuild({
			'index.html':
				'<body><load src="src/a.html" /><load src="src/b.html" /></body>',
			'src/a.html': '<p>A</p>',
			'src/b.html': '<p>B</p>',
		});

		expect(html).toContain('<body><p>A</p><p>B</p></body>');
	});

	it('supports multi-line tags', async () => {
		const html = await renderBuild({
			'index.html': `<body>
	<load
		src="src/link.html"
		label="Home"
	/>
</body>`,
			'src/link.html': '<a>{=$label}</a>',
		});

		expect(html).toContain('<a>Home</a>');
	});

	it('resolves nested includes with root-based paths', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="src/layout.html" /></body>',
			'src/layout.html': '<main><load src="src/parts/nav.html" /></main>',
			'src/parts/nav.html': '<nav>Nav</nav>',
		});

		expect(html).toContain('<main><nav>Nav</nav></main>');
	});

	it('resolves a relative include from index.html', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="./src/header.html" /></body>',
			'src/header.html': '<header>Relative</header>',
		});

		expect(html).toContain('<header>Relative</header>');
	});

	// Known bug (point 3): a relative include inside a partial that was
	// itself included relatively resolves against a broken path.
	// When fixed, change `it.fails` to `it`.
	it.fails('resolves nested relative includes', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="./src/layout.html" /></body>',
			'src/layout.html': '<main><load src="./parts/nav.html" /></main>',
			'src/parts/nav.html': '<nav>Nav</nav>',
		});

		expect(html).toContain('<main><nav>Nav</nav></main>');
	});
});

describe('attributes', () => {
	it('replaces {=$name} placeholders with attribute values', async () => {
		const html = await renderBuild({
			'index.html': `<body>
<load src="src/link.html" label="DuckDuckGo" href="https://duckduckgo.com/" />
<load src="src/link.html" label="Google" href="https://google.com" />
</body>`,
			'src/link.html': '<a href="{=$href}">{=$label}</a>',
		});

		expect(html).toContain('<a href="https://duckduckgo.com/">DuckDuckGo</a>');
		expect(html).toContain('<a href="https://google.com">Google</a>');
	});

	it('replaces every occurrence of a placeholder', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="src/x.html" name="Ana" /></body>',
			'src/x.html': '<p>{=$name} and {=$name}</p>',
		});

		expect(html).toContain('<p>Ana and Ana</p>');
	});

	it('keeps unknown placeholders by default', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="src/x.html" /></body>',
			'src/x.html': '<p>{=$missing}</p>',
		});

		expect(html).toContain('<p>{=$missing}</p>');
	});

	it('replaces unknown placeholders with `replace.undefined`', async () => {
		const html = await renderBuild(
			{
				'index.html': '<body><load src="src/x.html" a="1" /></body>',
				'src/x.html': '<p>{=$a}-{=$missing}</p>',
			},
			{ replace: { undefined: 'N/A' } },
		);

		expect(html).toContain('<p>1-N/A</p>');
	});

	// Regression for point 2: `$&`, `$\``, `$'` used to be interpreted by
	// String.prototype.replace.
	it('keeps `$` patterns in attribute values literally', async () => {
		const html = await renderBuild({
			'index.html': '<body><load src="src/x.html" price="$& 10" /></body>',
			'src/x.html': '<p>{=$price}</p>',
		});

		expect(html).toContain('<p>$& 10</p>');
	});

	it('keeps `$` patterns in `replace.undefined` literally', async () => {
		const html = await renderBuild(
			{
				'index.html': '<body><load src="src/x.html" /></body>',
				'src/x.html': '<p>{=$missing}</p>',
			},
			{ replace: { undefined: "$'" } },
		);

		expect(html).toContain("<p>$'</p>");
	});

	it('keeps `$` patterns in partial content literally', async () => {
		const script = `<script>const s = "a".replace(/a/, "$\`$'$&");</script>`;
		const html = await renderBuild({
			'index.html': '<body><load src="src/x.html" /></body>',
			'src/x.html': script,
		});

		expect(html).toContain(script);
	});
});

describe('options', () => {
	it('supports a custom tag name and source attribute', async () => {
		const html = await renderBuild(
			{
				'index.html': '<body><loader file="src/x.html" /></body>',
				'src/x.html': '<p>Custom</p>',
			},
			{ tagName: 'loader', sourceAttr: 'file' },
		);

		expect(html).toContain('<body><p>Custom</p></body>');
	});
});

describe('errors', () => {
	it('throws when the source attribute is missing', async () => {
		await expect(
			renderBuild({
				'index.html': '<body><load label="x" /></body>',
			}),
		).rejects.toThrow("Source attribute 'src' missing");
	});

	it('throws when the file does not exist', async () => {
		await expect(
			renderBuild({
				'index.html': '<body><load src="src/nope.html" /></body>',
			}),
		).rejects.toThrow(/injectHTML: .*ENOENT/);
	});
});

describe('dev server', () => {
	it('injects partials when serving index.html', async () => {
		const root = createProject({
			'index.html': '<body><load src="src/x.html" name="dev" /></body>',
			'src/x.html': '<p>Hello {=$name}</p>',
		});

		const server = await createServer({
			root,
			configFile: false,
			logLevel: 'silent',
			plugins: [injectHTML()],
			server: { middlewareMode: true, hmr: false },
		});

		try {
			const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
			const html = await server.transformIndexHtml('/index.html', source);

			expect(html).toContain('<p>Hello dev</p>');
		} finally {
			await server.close();
		}
	});
});
