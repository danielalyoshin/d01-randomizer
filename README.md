# The Daily Catch

A browser-based fishing game for choosing the next CSCD01 tutorial presenter. Each group has a boat. Cast the lines, follow the hooks underwater, and compare the fish: **only the group with the smallest fish presents next**.

Check **Presented** above any boat to exclude that group from subsequent rounds. Run a new round before each presentation. The results also offer **Mark presented & return** to check the winning boat for you. No complete presentation order is generated.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm run build    # Static site in dist/
npm run preview  # Preview the production build
npm test         # Random selection and saved-state tests
npx playwright install chromium
npm run test:e2e # Browser interaction and animation tests
```

To test with an existing Google Chrome installation instead of downloading Chromium, use `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`.

Deploy `dist/` to any static web host. No server, accounts, API keys, external assets, or runtime network requests are needed; the two typefaces are bundled into `dist/` at build time. Localhost or HTTPS is required for the browser's cryptographic random-number APIs.

## Using it in class

- The game fills the page. Open **Options** in the upper right to edit your groups; the panel starts collapsed and closes when you cast.
- Start with eight boats; use **Options** to rename groups, add up to twelve, or remove down to two.
- Check **Presented** above boats that should sit out. Excluded boats stay visible at the dock.
- **Cast the lines** starts a lively expedition, usually around 10–20 seconds. Pause/resume at any time or select **Reveal catch** to immediately see the same round's result.
- Fish swim freely through a small shared school (20–36 fish, depending on the crew and scene width). Lines sway at different depths and hook whichever fish they touch, regardless of markings. Hooks search back through the water if they miss on the first descent. All participating boats catch one fish.
- Hooked fish thrash against vibrating lines, with splashes, bubbles, and bite bursts. The camera follows the remaining hooks, then returns to the boats as the last catches reel in. A live counter tracks the action.
- Fish lengths are compared in boat order. The smallest is highlighted as the next presenter.
- Mark that group presented, then cast again for the next presentation.
- One remaining boat is supported. Once everyone is excluded, **Options → Reset crew** unchecks all boxes without removing or renaming boats.
- Group names, exclusions, and the latest catch are saved in this browser. **Options → View last catch** reopens the saved result. A private-browsing session may not preserve them.
- Optional sound, fullscreen, and help controls are in **Options**. Space casts or pauses when focus is outside a control; Escape dismisses dialogs or collapses the options panel. Reduced-motion preferences skip directly to the catch comparison.

## Fairness

Each round fills a shared school with unique fish lengths from 14.0–96.0 cm using a cryptographically random Fisher–Yates shuffle. Rejection sampling avoids modulo bias. Sampling without replacement prevents ties. Lengths are independent of swimming paths, and every fish has the same mouth contact radius. Fish size and markings never affect which hook catches it, so every participating group has the same chance of the smallest catch.

Fish swim and change depth independently of hooks; catches happen on contact. The round is simulated ahead using fixed time steps, then that exact simulation plays live. Instant reveal uses the simulated catches, so skipping, pausing, frame rate, or resizing cannot change the result. Before the cast, unusually slow swimming layouts are retried using geometry alone, and playback is capped at twice normal speed to keep motion readable. Fish keep their own markings when caught and in the comparison; the smallest catch is printed in red.

Built with vanilla JavaScript, Canvas 2D, CSS, and Vite. All scene art is drawn in code, printed in two inks on cream stock. Type is Big Shoulders and Archivo (SIL Open Font License), self-hosted via Fontsource.
