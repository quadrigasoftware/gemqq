# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.12] - 2026-02-24

### Added
- `-b, --browser` flag to open AI responses in the default web browser with GitHub-style Markdown formatting.
- Token usage statistics and timing information are now included at the top of the browser output.
- New dependencies: `marked` (Markdown parsing) and `open` (cross-platform browser launching).

### Fixed
- Improved `commandExists` logic to correctly detect when the `gemini` CLI is missing from the system PATH.
- Refined terminal output to inform users when responses are opened in a browser while suppressing redundant terminal rendering.

## [Unreleased]

## [0.5.10] - 2026-02-19

### Added
- Funding configuration and contributing guidelines.

## [0.5.9] - 2026-02-19

### Changed
- Version bump to 0.5.9.

## [0.5.8] - 2026-02-19

### Changed
- Renamed the package from `@quadrigasoftware/gemqq` to `gemqq` (unscoped).
- Updated README with the new installation command and npm badges.

## [0.5.5] - 2026-02-19

### Changed
- Dropped support for Node.js 18.x. Minimum required version is now Node.js 20.0.0.
- Updated GitHub Actions test matrix to exclude Node.js 18.

## [0.5.4] - 2026-02-19

### Added
- GitHub Actions CI workflow for automated testing.
- Enhanced README with status badges and improved examples.

### Changed
- Refactored `index.js` for better internal organization and modularity.

### Fixed
- Robust cleanup of temporary isolation directories.
- Improved signal handling for `SIGINT` and `SIGTERM`.

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
