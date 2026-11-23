// Keyboard controls: 1–7 select a hand card, Enter plays it,
// E ends the turn, R restarts, M toggles sound, H opens help.
export function bindKeyboard(ui) {
  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const game = ui.game;
    const key = event.key.toLowerCase();

    if (key === 'm') { ui.onToggleSound(); return; }
    if (key === 'h') { ui.onHelp(); return; }
    if (key === 'r') { ui.onRestart(); return; }

    if (game.phase === 'title' && (key === 'enter' || key === ' ')) { ui.onStart(); return; }
    if ((game.phase === 'won' || game.phase === 'lost') && key === 'enter') { ui.onRestart(); return; }
    if (game.phase !== 'playing' || game.turn !== 'player') return;

    if (key === 'e') { ui.onEndTurn(); return; }
    if (key === 'enter' || key === ' ') {
      if (game.selectedUid) ui.onPlaySelected();
      return;
    }
    const n = Number.parseInt(key, 10);
    if (n >= 1 && n <= game.player.hand.length) {
      game.selectedUid = game.player.hand[n - 1].uid;
      ui.refresh();
    }
  });
}
