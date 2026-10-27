# Kickoff World

A soccer game for phones. It installs from the browser as an app (PWA), works offline against the computer, and has online 1v1 through a small Node server.

- **193 national teams**: every UN member state, with its flag, kit colours and an estimated strength. The strengths are game estimates, not official rankings.
- **Custom teams**: name, 3-letter code, badge, kit colours, formation, 225 skill points split across attack, defence and speed, and your own player names.
- **Tournaments** (offline, saved on the phone): World Cup (32 teams, 8 groups, then knockouts), Continental Cup (8 or 16 teams from one region), Knockout Cup (16 teams). You can play or simulate each of your matches. Knockout draws go to golden-goal extra time, then penalties.
- **Quick match** against the CPU on Easy, Normal or Hard, lasting 2, 3 or 5 minutes.
- **Online 1v1**: quick match with a random player, or a private room with a 4-character code you share with a friend. The server runs the match, so clients can't fake scores or stats.
- 5-a-side, top-down. Controls: a joystick on the left, and SHOOT (hold for power, or tackle when defending), PASS (or switch player) and SPRINT on the right. On a keyboard: arrows/WASD, Space, J, Shift.

## Run it

```bash
cd soccer-game
npm install
npm start          # http://localhost:8080
npm test           # engine, tournaments, team data, online lobby
```

To try it on your phone, open `http://<your-computer-ip>:8080` on the same Wi-Fi. To install it as an app and get offline play, it must be served over **HTTPS** (any host below provides that).

## Deploy

`server/index.js` serves the game and the online `/ws` endpoint from one process. Deploy it to any Node host that supports WebSockets, such as Render, Railway or Fly.io:

- Root directory `soccer-game`, start command `npm start`
- It listens on the `PORT` environment variable. Health check: `/healthz`

If you host `public/` somewhere else (for example a static host), set the server address in the app under **Settings › Advanced** (`wss://your-server/ws`).

When you deploy changes, bump `VERSION` in `public/sw.js` so phones pick up the new files.

## How it's built

| Path | What it does |
| --- | --- |
| `public/shared/engine.js` | Match physics, rules, AI, goalkeepers. Pure logic: the browser runs it offline, the server runs it online |
| `public/shared/countries.js` | The 193 countries |
| `public/shared/teams.js` | Team stats, custom-team validation, kit clash handling |
| `public/shared/tournament.js` | Draws, groups, standings, brackets, simulated results |
| `public/app.js` | Screens and the match loop |
| `public/render.js`, `controls.js`, `net.js`, `audio.js` | Canvas drawing, touch/keyboard input, online client, sound |
| `public/sw.js` | Offline cache |
| `server/` | Static hosting, matchmaking, online matches |

No frameworks and no build step: plain JavaScript modules. The only dependency is `ws` on the server.

## Getting it into app stores

The PWA installs straight from the browser ("Add to Home screen"). For Google Play or the App Store, wrap `public/` with [Capacitor](https://capacitorjs.com). That needs a Google Play developer account (one-time fee) or an Apple Developer account (yearly fee).
