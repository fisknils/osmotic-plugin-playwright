# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project follows
[Semantic Versioning](https://semver.org/).

## [1.0.2] - 2026-10-21

### Changed

- The `osmotic` peer dependency accepts `^2.0.0 || ^3.0.0`, so the plugin installs alongside osmotic 3.

## [1.0.1] - 2026-10-21

### Changed

- The `osmotic` peer dependency accepts osmotic 2 and 3.

## [1.0.0] - 2026-10-21

### Added

- Fetch middleware that loads pages in a headless browser with Playwright and hands
  the rendered HTML to osmotic. Works with every osmotic command, `robots.txt`, slots,
  `maxPages` and events.
- `.render(options | false)` command: render options for the pages loaded after it,
  or `false` to fetch them without the browser.
- Render options `waitUntil`, `waitFor`, `timeout`, `block` and `actions`.
- Plugin options `renderAll`, `browserType`, `launch` and `context`.
- One browser shared by all runs, launched on the first rendered request and closed
  after the last run ends. Per-slot proxies, user agents and headers are applied.

[1.0.2]: https://www.npmjs.com/package/osmotic-plugin-playwright/v/1.0.2
[1.0.1]: https://www.npmjs.com/package/osmotic-plugin-playwright/v/1.0.1
[1.0.0]: https://www.npmjs.com/package/osmotic-plugin-playwright/v/1.0.0
