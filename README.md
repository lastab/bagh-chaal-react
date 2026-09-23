# Bāgh Chāl

A React PWA implementation of Bāgh Chāl ("Tigers and Goats"), the traditional Nepali board game.

## Game rules

- Played on a 5×5 board with diagonal lines connecting every intersection.
- 4 tigers start on the corners; 20 goats are placed one at a time.
- **Placement phase:** goats are placed on empty points.
- **Movement phase:** once all goats are placed, they move to adjacent points.
- Tigers move at any time, jumping over an adjacent goat into an empty point beyond to capture it.
- **Tigers win** by capturing 5 goats. **Goats win** by trapping all 4 tigers so none can move.

## Features

- Local pass-and-play, vs. bot, and online multiplayer modes
- Bot AI for both tiger and goat sides
- Online rooms/matchmaking via Firebase
- Installable PWA with offline caching and update-on-reload
- Sound/music toggles

## Tech stack

- [Vite](https://vitejs.dev/) + React 18
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for the service worker and manifest
- [Firebase](https://firebase.google.com/) (Realtime Database) for online play
- CSS Modules for styling

## Project structure

```
src/
  components/        UI components (Board, GameInfo, ModeSelect, OnlineSetup, ...)
  hooks/              useGameState (local game), useOnlineGame, useAudio
  lib/                firebase.js, roomService.js, matchmaking.js
  utils/              gameLogic.js (pure rules engine), botLogic.js (AI)
```

## Getting started

```bash
npm install
npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview the production build locally
```

Online multiplayer requires a Firebase project — configure credentials in `src/lib/firebase.js`.
