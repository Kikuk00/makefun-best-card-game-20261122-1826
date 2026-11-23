# Crown of Embers

[![best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826/Kikuk00/makefun-best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826/Kikuk00/makefun-best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Crown of Embers** is an original turn-based card duel that runs entirely
offline in a desktop browser. You are the Ember Heir, challenging Warden Vex
for the crown. Reduce the Warden to 0 life before yours runs out.

## How it plays

- **30 life each.** First to 0 loses.
- **Ember is mana.** Each turn you gain +1 max ember (up to 10), refill, and
  draw 2 cards. Every card costs ember (the blue number).
- **Four suits, told apart by colour and shape:** ▲ Flame (red, raw damage),
  ● Tide (blue, heal & draw), ◆ Thorn (green, tricks & shield),
  ■ Stone (tan, walls & ember).
- **Resonance:** play two cards of the same suit in one turn and the second
  gains +2 power — the heart of every hand's decision.
- **Status effects:** shield absorbs damage first, Burn hurts at the start of
  a turn, Snare cuts the victim's max ember.
- **A readable rival:** Warden Vex finishes you when it can, defends when
  hurt, and chases its own Resonance pairs — you can read its plan and play
  around it.

## Controls

Mouse and keyboard: click a card to select it, click again (or press Enter)
to play it. Keys `1–7` select a hand card, `E` ends the turn, `R` restarts,
`M` toggles sound, `H` shows the rules. Sounds are synthesized in the browser
— no audio files.

## Files

- `game/index.html` — the table; `game/styles.css` — all art is CSS.
- `game/src/cards.js` — the 14-card catalogue and the four suits.
- `game/src/state.js` — duel state, turn rules, Resonance, damage and healing.
- `game/src/ai.js` — Warden Vex's decision making.
- `game/src/render.js` — DOM rendering: table, hands, arena, overlays.
- `game/src/input.js` — keyboard controls.
- `game/src/audio.js` — synthesized sound effects (WebAudio, no files).
- `game/src/main.js` — bootstrap and turn flow.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with `vendor/makefun-game.ts`.

## Run it

Serve `game/` with any static server and open `index.html` in desktop Chrome,
or run the included check:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots in `screenshots/` are real renders of the game in headless Chrome:
the title screen, a mid-duel table (cover), the victory screen and the defeat
screen.
