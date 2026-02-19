# gemqq

Gemini Quick Question is a one-shot CLI wrapper for Google's Gemini, featuring interactive editor support, markdown rendering, and real-time token usage statistics. gemqq does not have memory nor context, it simply answers your 'quick questions' and prompts.

## Installation

```bash
npm install -g @quadrigasoftware/gemqq
```

## Usage

```bash
gemqq [OPTIONS] [PROMPT...]
```

### Options

- `-e, --edit`: Open prompt in default editor (`EDITOR` or `VISUAL`).
- `-r, --raw`: Output raw text (disable markdown rendering via `glow`).
- `-c, --copy`: Copy response to system clipboard.
- `-m, --model NAME`: Specify a custom model.
- `--style NAME`: Specify a `glow` style (e.g., `auto`, `dark`, `light`). Default is `auto`.
- `--no-stats`: Suppress token usage statistics and timing info.
- `--project`: Enable full project workspace context. By default, `gemqq` isolates file context to zero by running in a temporary directory. Use this flag when you want Gemini to see your codebase.
- `--pro`: Use `gemini-3-pro-preview` model.
- `--flash`: Use `gemini-3-flash-preview` model (Default).
- `--debug`: Enable debug mode.
- `-h, --help`: Show help message.

### Token Statistics

By default, `gemqq` displays token usage and execution time:
`(Done in 5.9s, 4551 tokens (4502i / 2o))`

- **i**: Input Tokens (Prompt)
- **o**: Output Tokens (Candidates)

Use `--no-stats` to hide this information.

### Context Isolation

By default, `gemqq` executes the Gemini CLI in a temporary directory to isolate your file context to zero. This prevents Gemini from automatically snapshotting your current directory tree, which significantly reduces token usage and improves privacy for general queries.

If you need Gemini to analyze your codebase or reference local files, use the `--project` flag to run in your current working directory with full context enabled.

### Examples

```bash
gemqq Who made liquid soap and why?
cat file.txt | gemqq Summarize this
gemqq -e --pro
gemqq Draft an email -c
gemqq Explain recursion --style dark
```

> **Note:** Prompts do not require quotes unless they contain special shell characters like `?`, `*`, `&`, `;`, or `|`. If your prompt includes these, you should either quote it or escape the characters.

## Testing

The project includes automated integration and unit tests using [Vitest](https://vitest.dev/).

```bash
npm test
```

## Dependencies

- [Gemini CLI](https://github.com/google/gemini-cli)
- [Glow](https://github.com/charmbracelet/glow) (for markdown rendering)
