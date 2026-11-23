// Crown of Embers — bootstrap: wires state, rendering, input and sound together,
// runs the turn flow, and builds deterministic demo states for screenshots
// (?shot=title | cover | win | loss).
import {
  newGame, startDuel, playCard, endTurn, beginTurn, nextRound,
  resonanceBonus, handFromIds,
} from './state.js';
import { renderAll, showBanner, showHelp } from './render.js';
import { bindKeyboard } from './input.js';
import { playSound, setMuted, isMuted } from './audio.js';
import { runAiTurn } from './ai.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const SHOT_SEED = 20261122;

let game = newGame(shot ? SHOT_SEED : undefined);

const ui = {
  game,
  onCardClick(uid) {
    if (game.phase !== 'playing' || game.turn !== 'player') return;
    if (game.selectedUid === uid) this.onPlaySelected();
    else {
      game.selectedUid = uid;
      refresh();
    }
  },
  onPlaySelected() {
    playSelectedCard();
  },
  onStart() {
    startDuel(game);
    playSound('turn');
    refresh();
  },
  onRestart() {
    game = newGame();
    ui.game = game;
    startDuel(game);
    refresh();
  },
  onEndTurn() {
    if (!endTurn(game)) return;
    beginTurn(game, game.foe);
    refresh();
    window.setTimeout(runFoeTurn, 650);
  },
  onHelp() { showHelp(ui); },
  onToggleSound() {
    setMuted(!isMuted());
    document.getElementById('soundBtn').textContent = `Sound: ${isMuted() ? 'off' : 'on'}`;
  },
  refresh,
};

function refresh() {
  renderAll(game, ui);
  const status = document.getElementById('status');
  status.textContent =
    game.phase === 'playing'
      ? `Round ${game.round}. You have ${game.player.life} life, Warden Vex has ${game.foe.life}. ${game.turn === 'player' ? 'Your turn.' : 'Warden Vex is thinking.'}`
      : game.phase === 'won' ? 'You won the duel.' : game.phase === 'lost' ? 'You lost the duel.' : 'Title screen. Press Enter to begin.';
}

function playSelectedCard() {
  const uid = game.selectedUid;
  if (!uid) return;
  const card = game.player.hand.find((c) => c.uid === uid);
  if (!card) return;
  const bonus = resonanceBonus(game, game.player, card);
  const line = playCard(game, game.player, uid);
  if (!line) return;
  game.selectedUid = null;
  if (bonus > 0) {
    showBanner(`🔥 RESONANCE! +${bonus} power — ${card.name}`);
    playSound('resonance');
  } else if (card.kind === 'attack' || card.kind === 'trick') {
    playSound('hurt');
  } else {
    playSound('play');
  }
  if (game.phase === 'won') playSound('win');
  if (game.phase === 'lost') playSound('lose');
  refresh();
}

function runFoeTurn() {
  if (game.phase !== 'playing' || game.turn !== 'foe') return;
  runAiTurn(game, (uid) => {
    const card = game.foe.hand.find((c) => c.uid === uid);
    const bonus = card ? resonanceBonus(game, game.foe, card) : 0;
    const line = playCard(game, game.foe, uid);
    if (line && bonus > 0) showBanner(`🔥 Warden Vex triggers RESONANCE +${bonus}!`);
    if (line) playSound(card && card.kind === 'attack' ? 'hurt' : 'play');
    refresh();
  });
  if (game.phase === 'playing') {
    nextRound(game);
    playSound('turn');
  }
  if (game.phase === 'won') playSound('win');
  if (game.phase === 'lost') playSound('lose');
  refresh();
}

// Deterministic demo states, used only for screenshots (?shot=...).
function applyShotState(name) {
  document.body.classList.add('shot');
  if (name === 'title') return; // fresh game already shows the title screen

  if (name === 'cover') {
    startDuel(game);
    game.round = 4;
    game.player.life = 24;
    game.player.shield = 5;
    game.player.ember = 5;
    game.player.maxEmber = 5;
    game.player.hand = handFromIds(['fireball', 'ember-strike', 'healing-spring', 'stonewall', 'deep-draw']);
    game.player.deck = game.player.deck.slice(0, 14);
    game.foe.life = 18;
    game.foe.shield = 3;
    game.foe.ember = 3;
    game.foe.maxEmber = 4;
    game.foe.hand = handFromIds(['thorn-lash', 'boulder', 'snare-vine', 'briar-shield', 'ignite']);
    game.foe.deck = game.foe.deck.slice(0, 12);
    game.damageDealt = 12;
    game.playedThisTurn = handFromIds(['ember-strike', 'ignite']).map((c, i) => ({ ...c, power: i === 1 ? 6 : 3, by: 'You' }));
    game.player.playedSuitsThisTurn = ['flame'];
    game.log = [
      'The duel begins. You go first — play a card!',
      'You play Ember Strike for 3 damage.',
      'Warden Vex plays Briar Shield, gaining 5 shield.',
      '— Round 2 — your turn.',
      'You play Deep Draw, drawing 2.',
      'Warden Vex plays Boulder for 5 damage.',
      '— Round 3 — your turn.',
      'You play Stonewall, gaining 8 shield.',
      '— Round 4 — your turn.',
      'You play Ember Strike for 3 damage.',
      'You play Ignite — RESONANCE +2! for 6 damage. Burn set.',
    ];
    return;
  }

  if (name === 'win') {
    startDuel(game);
    game.round = 7;
    game.player.life = 11;
    game.player.shield = 2;
    game.player.ember = 2;
    game.player.maxEmber = 7;
    game.player.hand = handFromIds(['fireball', 'healing-spring', 'stonewall']);
    game.foe.life = 0;
    game.foe.shield = 0;
    game.foe.ember = 0;
    game.foe.hand = handFromIds(['thorn-lash']);
    game.damageDealt = 34;
    game.cardsPlayed = 21;
    game.phase = 'won';
    game.winner = 'player';
    game.log = [
      '— Round 7 — your turn.',
      'You play Fireball for 6 damage.',
      'Warden Vex falls. The Crown of Embers is yours!',
    ];
    return;
  }

  if (name === 'loss') {
    startDuel(game);
    game.round = 6;
    game.player.life = 0;
    game.player.shield = 0;
    game.player.ember = 1;
    game.player.maxEmber = 6;
    game.player.hand = handFromIds(['ember-strike', 'briar-shield']);
    game.foe.life = 9;
    game.foe.shield = 4;
    game.foe.ember = 2;
    game.foe.maxEmber = 6;
    game.foe.hand = handFromIds(['fireball', 'boulder']);
    game.damageDealt = 21;
    game.cardsPlayed = 17;
    game.phase = 'lost';
    game.winner = 'foe';
    game.log = [
      '— Round 6 — your turn.',
      'Warden Vex plays Fireball for 6 damage.',
      'Your ember fades. Warden Vex keeps the crown… this time.',
    ];
  }
}

document.getElementById('endTurnBtn').addEventListener('click', () => ui.onEndTurn());
document.getElementById('restartBtn').addEventListener('click', () => ui.onRestart());
document.getElementById('helpBtn').addEventListener('click', () => ui.onHelp());
document.getElementById('soundBtn').addEventListener('click', () => ui.onToggleSound());

bindKeyboard(ui);
if (shot) applyShotState(shot);
refresh();
