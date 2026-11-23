// Game state and turn rules for Crown of Embers.
// A duel: first to 0 life loses. Each turn the active side gains +1 max ember
// (cap 10), refills ember, and draws 2 cards. Playing two cards of the same
// suit in one turn triggers Resonance: the second card's power +2.
import { buildDeck, cardById } from './cards.js';
import { makeRng, shuffleDeck } from './rng.js';

export const MAX_LIFE = 30;
export const MAX_HAND = 7;
export const MAX_EMBER = 10;

export function newFighter(name) {
  return {
    name,
    life: MAX_LIFE,
    shield: 0,
    ember: 1,
    maxEmber: 1,
    deck: [],
    hand: [],
    discard: [],
    burn: 0,
    snared: false,
    playedSuitsThisTurn: [],
  };
}

export function newGame(seed = (Math.random() * 0xffffffff) >>> 0) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    phase: 'title', // 'title' | 'playing' | 'won' | 'lost'
    round: 1,
    turn: 'player', // 'player' | 'foe'
    player: newFighter('You'),
    foe: newFighter('Warden Vex'),
    playedThisTurn: [],
    log: [],
    damageDealt: 0,
    cardsPlayed: 0,
    selectedUid: null,
    winner: null,
  };
  game.player.deck = shuffleDeck(buildDeck(), rng);
  game.foe.deck = shuffleDeck(buildDeck(), rng);
  drawCards(game, game.player, 4);
  drawCards(game, game.foe, 4);
  return game;
}

export function drawCards(game, fighter, count) {
  for (let i = 0; i < count; i++) {
    if (fighter.hand.length >= MAX_HAND) return;
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.deck = shuffleDeck(fighter.discard, game.rng);
      fighter.discard = [];
      game.log.push(`${fighter.name} reshuffled the discard pile.`);
    }
    fighter.hand.push(fighter.deck.pop());
  }
}

export function startDuel(game) {
  game.phase = 'playing';
  game.turn = 'player';
  game.log.push('The duel begins. You go first — play a card!');
}

export function beginTurn(game, fighter) {
  if (fighter.snared) {
    fighter.maxEmber = Math.max(1, fighter.maxEmber - 1);
    fighter.snared = false;
    game.log.push(`${fighter.name} is snared and loses 1 max ember.`);
  }
  fighter.maxEmber = Math.min(MAX_EMBER, fighter.maxEmber + 1);
  fighter.ember = fighter.maxEmber;
  fighter.playedSuitsThisTurn = [];
  if (fighter.burn > 0) {
    const burn = fighter.burn;
    fighter.life = Math.max(0, fighter.life - burn);
    if (fighter === game.foe) game.damageDealt += burn;
    game.log.push(`${fighter.name} burns for ${burn} damage.`);
    fighter.burn = 0;
    checkEnd(game);
  }
  drawCards(game, fighter, 2);
}

export function endTurn(game) {
  if (game.phase !== 'playing' || game.turn !== 'player') return false;
  game.turn = 'foe';
  game.playedThisTurn = [];
  game.selectedUid = null;
  return true;
}

export function nextRound(game) {
  game.round += 1;
  game.turn = 'player';
  game.playedThisTurn = [];
  game.selectedUid = null;
  beginTurn(game, game.player);
  game.log.push(`— Round ${game.round} — your turn.`);
}

// Damage first eats shield, then life. Returns the life damage dealt.
export function applyDamage(game, target, amount, source = 'card') {
  let left = amount;
  if (target.shield > 0 && source !== 'pierce') {
    const absorbed = Math.min(target.shield, left);
    target.shield -= absorbed;
    left -= absorbed;
  }
  if (left > 0) {
    target.life = Math.max(0, target.life - left);
    if (target === game.foe) game.damageDealt += left;
  }
  checkEnd(game);
  return left;
}

export function checkEnd(game) {
  if (game.phase !== 'playing') return;
  if (game.foe.life <= 0) {
    game.phase = 'won';
    game.winner = 'player';
    game.log.push('Warden Vex falls. The Crown of Embers is yours!');
  } else if (game.player.life <= 0) {
    game.phase = 'lost';
    game.winner = 'foe';
    game.log.push('Your ember fades. Warden Vex keeps the crown… this time.');
  }
}

// Resonance: the second card of a suit played this turn gets +2 power.
export function resonanceBonus(game, fighter, card) {
  return fighter.playedSuitsThisTurn.includes(card.suit) ? 2 : 0;
}

export function canPlay(game, fighter, card) {
  return game.phase === 'playing' && fighter.ember >= card.cost;
}

// Play one card from a fighter's hand. Returns a description string, or null.
export function playCard(game, fighter, cardUid) {
  const idx = fighter.hand.findIndex((c) => c.uid === cardUid);
  if (idx < 0) return null;
  const card = fighter.hand[idx];
  if (!canPlay(game, fighter, card)) return null;
  const foe = fighter === game.player ? game.foe : game.player;
  const bonus = resonanceBonus(game, fighter, card);
  const power = card.power + bonus;
  fighter.ember -= card.cost;
  fighter.hand.splice(idx, 1);
  fighter.discard.push(card);
  fighter.playedSuitsThisTurn.push(card.suit);
  game.cardsPlayed += 1;
  game.playedThisTurn.push({ ...card, power, by: fighter.name });

  let line = `${fighter.name} plays ${card.name}`;
  if (bonus > 0) line += ` — RESONANCE +${bonus}!`;
  switch (card.kind) {
    case 'attack': {
      const dealt = applyDamage(game, foe, power, card.extra === 'pierce' ? 'pierce' : 'card');
      line += ` for ${dealt} damage${card.extra === 'pierce' ? ' through shield' : ''}.`;
      if (card.extra === 'burn' && game.phase === 'playing') {
        foe.burn += 2;
        line += ' Burn set.';
      }
      break;
    }
    case 'guard':
      fighter.shield += power;
      line += `, gaining ${power} shield.`;
      break;
    case 'heal':
      fighter.life = Math.min(MAX_LIFE, fighter.life + power);
      line += `, restoring ${power} life.`;
      break;
    case 'draw':
      drawCards(game, fighter, power);
      line += `, drawing ${power}.`;
      if (card.id === 'focus') {
        fighter.life = Math.min(MAX_LIFE, fighter.life + 2);
        line += ' Heals 2.';
      }
      break;
    case 'ember':
      fighter.ember = Math.min(MAX_EMBER, fighter.ember + power);
      line += `, gaining ${power} ember.`;
      break;
    case 'trick': {
      const dealt = applyDamage(game, foe, power);
      foe.snared = true;
      line += ` for ${dealt} damage and snares the foe.`;
      break;
    }
    default:
      break;
  }
  game.log.push(line);
  return line;
}

export function scoreSummary(game) {
  return {
    rounds: game.round,
    damageDealt: game.damageDealt,
    cardsPlayed: game.cardsPlayed,
    lifeLeft: game.player.life,
  };
}

// Rebuild a game object from a plain card-id list (used by screenshot states).
export function handFromIds(ids) {
  return ids.map((id, i) => ({ ...cardById(id), uid: `${id}-shot${i}` }));
}
