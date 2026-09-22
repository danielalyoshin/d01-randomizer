# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A CSCD01 teaching assistant or instructor running a tutorial. They drive the game from a laptop connected to the room projector while the whole class watches from their seats. Students are the audience, not the operators: they read boat names, follow the hooks, and react to the result from the back of the room.

## Product Purpose

The Daily Catch picks which student group presents next in a CSCD01 tutorial. Each group is a boat; every participating boat hooks one fish, and the group with the smallest fish presents. It turns an awkward "who goes next?" moment into a short, fair, watchable event. Success: the room trusts the pick, the moment is fun rather than tense, and the TA can run a round in seconds and move on.

## Positioning

Not a spinner wheel or name-picker. The randomness is dramatized as a fishing derby played out live on a shared screen, with a transparent side-by-side comparison of every catch at the end. The pick is provably fair (cryptographic shuffle, unique lengths, contact-based catches independent of fish size) and replayable instantly.

## Operating Context

- Projected in a tutorial room; readability at distance matters more than close-up detail.
- One round per presentation: cast, watch (about 10–20 s), reveal, mark the winner presented, repeat.
- Groups that already presented stay visible at the dock but sit out.
- The TA may pause, skip straight to the reveal, or reopen the last result.
- Runs as a static site; state lives in the browser's local storage.

## Capabilities and Constraints

- 2–12 groups (default 8), renameable (max 32 chars), each with a fixed boat color from a 12-color set.
- "Presented" checkbox per boat; Reset crew clears all; one remaining boat is supported.
- Pause/resume, Reveal catch (instant, same result), View last catch, optional sound, fullscreen, How to play.
- Keyboard: Space casts or pauses outside controls; Escape closes dialogs/options.
- Reduced motion skips straight to the comparison.
- Vanilla JS, Canvas 2D, CSS, Vite. No external assets, fonts, or runtime network requests. All scene art is drawn in code.
- Fairness logic (randomizer.js, fishing.js) and its tests are product truth and must not change behavior.

## Brand Commitments

- Name: The Daily Catch · CSCD01.
- Voice: playful fishing puns ("Cast the lines", "Fish on!", "Reel them in"), short and friendly.
- Rule stated plainly everywhere: smallest fish presents next.

## Evidence on Hand

- README.md documents the fairness method; the How to play dialog restates it for students.
- Playwright e2e tests (e2e/fishing.spec.js) and unit tests (tests/) define expected behavior and accessible names.

## Product Principles

1. Fairness is visible: every catch is shown to scale, in boat order, so nobody suspects the pick.
2. The room is the audience: legible from the back row, exciting to watch, fast for the TA.
3. Low stakes, high fun: presenting next should feel like a game outcome, not a punishment.
4. The TA stays in control: pause, skip, and exclusions are always one action away.

## Accessibility & Inclusion

Keyboard operable, screen-reader announcements for catches and results, reduced-motion support, and accessible names the e2e tests rely on.
