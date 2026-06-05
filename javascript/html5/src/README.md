# Yet Another Code Breaker (HTML5/Javascript)

Yet Another Code Breaker is a browser-first deduction game built with ES modules, a worker-backed
rules engine, persistent highscores, and offline-ready packaging.

## Feature List

- Secret code length of `4` or `5`
- Value range from `6` to `10`
- Symbol representations:
  - numbers
  - colors
  - letters
  - symbols
- Maximum attempts of `8`, `10`, `12`, or unlimited
- Persistent highscores for:
  - today
  - this week
  - this month
- Six frontend languages:
  - English
  - German
  - French
  - Portuguese
  - Spanish
  - Italian
- Separate `Rules`, `Options`, and `About` pages with the game board hidden while those pages are open
- PWA manifests, service worker caching, and Cordova config

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Install

```powershell
npm install
```

### Run locally

```powershell
node tests/server.js
```

Open <http://localhost:4173>.

## Test Commands

Unit tests:

```powershell
npm test
```

Unit coverage:

```powershell
npm run test:coverage
```

E2E tests:

```powershell
npm run test:e2e
```

All tests:

```powershell
npm run test:all
```

## Coverage

Vitest coverage is enforced at:

- Statements >= 98
- Branches >= 98
- Functions >= 98
- Lines >= 98

## Architecture

See `doc/software_architecture.md`.

## Implementation Notes

- Pure rule transitions live in `js/board.js`.
- Utility normalization and symbol catalogs live in `js/common.js`.
- Worker orchestration lives in `js/controller.js`.
- UI state coordination lives in `js/store.js` and `js/hmi.js`.
- Rendering is isolated in `js/renderer.js`.

## License

Source code is MIT-licensed.
