// DOM rendering: turns game state into the table, hands, arena and overlays.
import { SUITS, kindLabel } from './cards.js';
import { MAX_LIFE, scoreSummary } from './state.js';

const $ = (id) => document.getElementById(id);

export function cardElement(card, opts = {}) {
  const suit = SUITS[card.suit];
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `card suit-${suit.css}${opts.mini ? ' mini' : ''}${opts.selected ? ' selected' : ''}`;
  el.disabled = !!opts.disabled;
  el.dataset.uid = card.uid;
  el.innerHTML =
    `<span class="card-head"><span class="card-cost">${card.cost}</span>` +
    `<span class="card-suit ${suit.css}" title="${suit.name}">${suit.glyph}</span></span>` +
    `<span class="card-art">${card.art}</span>` +
    `<span class="card-name">${card.name}</span>` +
    `<span class="card-kind">${suit.name} · ${kindLabel(card.kind)}</span>` +
    `<span class="card-power ${suit.css}">${card.power}</span>` +
    `<span class="card-text">${card.text}</span>`;
  if (opts.keyLabel) {
    const k = document.createElement('span');
    k.className = 'card-key';
    k.textContent = opts.keyLabel;
    el.appendChild(k);
  }
  return el;
}

function lifeFill(el, textEl, life) {
  el.style.width = `${Math.max(0, (life / MAX_LIFE) * 100)}%`;
  textEl.textContent = `${life} / ${MAX_LIFE}`;
}

export function renderAll(game, ui) {
  // Fighters.
  lifeFill($('foeLifeFill'), $('foeLifeText'), game.foe.life);
  lifeFill($('playerLifeFill'), $('playerLifeText'), game.player.life);
  $('foeShield').textContent = `🛡 Shield ${game.foe.shield}`;
  $('playerShield').textContent = `🛡 Shield ${game.player.shield}`;
  $('foeEmber').textContent = `🔥 Ember ${game.foe.ember} / ${game.foe.maxEmber}`;
  $('playerEmber').textContent = `🔥 Ember ${game.player.ember} / ${game.player.maxEmber}`;
  $('foeDeck').textContent = `Deck ${game.foe.deck.length}`;
  $('playerDeck').textContent = `Deck ${game.player.deck.length}`;
  $('playerHandCount').textContent = `Hand ${game.player.hand.length}`;
  $('roundLabel').textContent = `Round ${game.round}`;
  $('turnLabel').textContent =
    game.phase === 'title' ? 'Ready to duel'
    : game.phase === 'playing' ? (game.turn === 'player' ? 'Your turn' : 'Warden Vex is thinking…')
    : 'Duel over';
  $('scoreLabel').textContent = `Damage dealt ${game.damageDealt}`;
  $('endTurnBtn').disabled = !(game.phase === 'playing' && game.turn === 'player');

  // Opponent hand: card backs, one per card, so the count is always visible.
  const foeHand = $('foeHand');
  foeHand.innerHTML = '';
  game.foe.hand.forEach(() => {
    const back = document.createElement('div');
    back.className = 'card-back mini';
    back.textContent = '♜';
    foeHand.appendChild(back);
  });
  if (game.foe.hand.length === 0) {
    const none = document.createElement('div');
    none.className = 'played-empty';
    none.textContent = 'Warden Vex holds no cards.';
    foeHand.appendChild(none);
  }

  // Player hand.
  const playerHand = $('playerHand');
  playerHand.innerHTML = '';
  game.player.hand.forEach((card, i) => {
    const playable = game.phase === 'playing' && game.turn === 'player' && game.player.ember >= card.cost;
    const el = cardElement(card, {
      selected: game.selectedUid === card.uid,
      disabled: !playable,
      keyLabel: String(i + 1),
    });
    el.addEventListener('click', () => ui.onCardClick(card.uid));
    playerHand.appendChild(el);
  });

  // Arena: cards played this turn, most recent first.
  const played = $('playedRow');
  played.innerHTML = '';
  if (game.playedThisTurn.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'played-empty';
    empty.textContent = 'No cards played yet this turn — play a card to open the duel.';
    played.appendChild(empty);
  } else {
    for (const playedCard of [...game.playedThisTurn].reverse()) {
      played.appendChild(cardElement(playedCard, { mini: true, disabled: true }));
    }
  }

  // Log, newest at the bottom.
  const logList = $('logList');
  logList.innerHTML = '';
  for (const line of game.log.slice(-30)) {
    const li = document.createElement('li');
    li.textContent = line;
    logList.appendChild(li);
  }
  logList.scrollTop = logList.scrollHeight;

  renderOverlay(game, ui);
}

export function showBanner(text) {
  const banner = $('banner');
  banner.hidden = false;
  banner.textContent = text;
  banner.classList.remove('pop');
  void banner.offsetWidth; // restart the animation
  banner.classList.add('pop');
  window.setTimeout(() => { banner.hidden = true; }, 2200);
}

function renderOverlay(game, ui) {
  const overlay = $('overlay');
  const card = $('overlayCard');
  if (game.phase === 'title') {
    overlay.hidden = false;
    card.innerHTML =
      `<div class="big">♛🔥</div>` +
      `<h1>CROWN OF EMBERS</h1>` +
      `<p>A card duel against Warden Vex. Reduce the Warden to 0 life before yours runs out.</p>` +
      `<div class="suit-key">` +
      `<span><b style="color:#e2483d">▲ Flame</b> — raw damage</span>` +
      `<span><b style="color:#3d9be2">● Tide</b> — heal &amp; draw</span>` +
      `<span><b style="color:#7bc96f">◆ Thorn</b> — tricks &amp; shield</span>` +
      `<span><b style="color:#b8a88a">■ Stone</b> — walls &amp; ember</span></div>` +
      `<p class="sub">Play two cards of the same suit in one turn for <b>Resonance +2 power</b>. ` +
      `Each turn you gain ember and draw 2 cards. Click a card or press 1–7, Enter to play, E to end turn.</p>` +
      `<button class="cta" id="startBtn" type="button">Begin the duel</button>`;
    $('startBtn').addEventListener('click', () => ui.onStart());
    return;
  }
  if (game.phase === 'won' || game.phase === 'lost') {
    const won = game.phase === 'won';
    const s = scoreSummary(game);
    overlay.hidden = false;
    card.innerHTML =
      `<div class="big">${won ? '👑' : '💀'}</div>` +
      `<h1>${won ? 'VICTORY!' : 'DEFEAT'}</h1>` +
      `<h2>${won ? 'The Crown of Embers is yours!' : 'Warden Vex keeps the crown… this time.'}</h2>` +
      `<div class="stats">` +
      `<span class="stat"><b>${s.rounds}</b>rounds</span>` +
      `<span class="stat"><b>${s.damageDealt}</b>damage dealt</span>` +
      `<span class="stat"><b>${s.cardsPlayed}</b>cards played</span>` +
      `<span class="stat"><b>${s.lifeLeft}</b>life left</span></div>` +
      `<p class="sub">${won ? 'The Warden bows. The ember court cheers your name.' : 'Study the Warden’s plays, shuffle up and challenge again.'}</p>` +
      `<button class="cta" id="againBtn" type="button">Play again</button>`;
    $('againBtn').addEventListener('click', () => ui.onRestart());
    return;
  }
  overlay.hidden = true;
}

export function showHelp(ui) {
  const overlay = $('overlay');
  const card = $('overlayCard');
  overlay.hidden = false;
  card.innerHTML =
    `<h2>How to play</h2>` +
    `<ol class="rules-list">` +
    `<li><b>Goal:</b> reduce Warden Vex to 0 life. If your life hits 0, you lose.</li>` +
    `<li><b>Each turn:</b> gain +1 max ember (up to 10), refill ember, draw 2 cards.</li>` +
    `<li><b>Play cards</b> by clicking them. Each card costs ember (blue number).</li>` +
    `<li><b>Resonance:</b> two cards of the same suit in one turn — the second gains +2 power.</li>` +
    `<li><b>Shield</b> absorbs damage first. <b>Burn</b> hurts at the start of a turn. <b>Snare</b> cuts max ember.</li>` +
    `<li><b>Keys:</b> 1–7 select a card, Enter plays it, E ends your turn, R restarts.</li></ol>` +
    `<button class="cta" id="closeHelpBtn" type="button">Back to the table</button>`;
  $('closeHelpBtn').addEventListener('click', () => {
    overlay.hidden = true;
    renderAll(ui.game, ui);
  });
}
