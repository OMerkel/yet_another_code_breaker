# Yet Another Code Breaker

This repository now hosts Yet Another Code Breaker as the primary HTML5 implementation in `javascript/html5/src`.

## Main Requirements Derived From `doc/rules.md`

- Deductive gameplay with a hidden code and feedback for exact and misplaced symbols
- Configurable code length, symbol range, representation, and attempt limit
- Persistent highscores for day, week, and month
- Separate `Rules`, `Options`, and `About` views that return to the current game board
- Winning and losing result animations
- Progressive Web App packaging and updated mobile metadata

## Workspace Layout

- `doc/rules.md`: source gameplay requirements
- `doc/software_architecture.md`: implementation architecture
- `javascript/html5/src`: browser application, tests, manifests, assets

## Development

From `javascript/html5/src`:

```powershell
npm install
npm test
npm run test:coverage
npm run test:e2e
```
