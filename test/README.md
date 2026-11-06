# Manual testing

Each folder is a standalone Vite root using the plugin source directly.
Install the repository dependencies, then run commands from the repository root:

```sh
npx vite test/basic
```

Open the URL printed by Vite. Replace `basic` with any scenario below.

| Scenario         | Expected result                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `basic`          | Four parts render: explicit `.html` and `.htm` files, plus directory `index.html` and `index.htm` files.                                                                    |
| `nested`         | Layout, nested content, shared content, and footer render in order. Paths starting with `.` resolve relative to the including file; other paths resolve from the Vite root. |
| `arguments`      | Vite and GitHub links have distinct URLs, labels, and matching titles. The third link retains the literal `{=$label}` placeholder.                                          |
| `custom-options` | The custom `include` tag and `file` attribute render a card headed “Custom include” with “Description: (not supplied)”. The terminal logs the included file path.           |
| `env`            | Entry, part, and nested part show “Message from .env”. The defined message is “Message from define”; mode is `development` in dev and `production` in builds.               |

## Reloading

With a scenario open, edit a part's visible text and save. The browser should
reload and show the change. Also try a deeply nested part in `nested` or `env`.
Restore the text when finished.

## Production builds

```sh
npx vite build test/basic
npx vite preview test/basic
```

Check the preview and `test/basic/dist/index.html` against the same expected
results. Each scenario's build output stays in its own ignored `dist/` folder.
