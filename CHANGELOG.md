# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.3] - 2026-02-19

### Added
- Examples from README.md are now included in the `--help` output.
- `CHANGELOG.md` to track project evolution.

### Fixed
- Robust signal handling: Fixed an issue where `SIGINT` (Ctrl+C) would not always terminate the process or clean up temporary files correctly.
- Improved cleanup logic for temporary isolation directories and spinners.

## [0.5.2] - 2026-02-15

### Added
- Real-time token usage statistics (input, output, and cached tokens).
- `--no-stats` flag to suppress token and timing information.
- Timing information for response generation.

## [0.5.1] - 2026-02-10

### Added
- `--project` flag to enable full workspace context when needed.
- Automatic context isolation by running in a temporary directory by default.
- Markdown rendering support via `glow` with customizable styles.

## [0.5.0] - 2026-02-01

### Added
- Initial release of `gemqq`.
- One-shot wrapper for `@google/gemini-cli`.
- Interactive editor support with `-e, --edit`.
- Clipboard support with `-c, --copy`.
- Model selection flags (`--pro`, `--flash`).
