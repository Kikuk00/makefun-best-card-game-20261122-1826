// The card catalogue: every card in Crown of Embers, its suit, cost and effect.
// Suits are told apart by colour AND shape, never by text alone:
//   Flame ▲ red, Tide ● blue, Thorn ◆ green, Stone ■ tan.
export const SUITS = {
  flame: { name: 'Flame', glyph: '▲', art: '🔥', css: 'flame' },
  tide: { name: 'Tide', glyph: '●', art: '💧', css: 'tide' },
  thorn: { name: 'Thorn', glyph: '◆', art: '🌿', css: 'thorn' },
  stone: { name: 'Stone', glyph: '■', art: '🪨', css: 'stone' },
};

// kind: 'attack' | 'guard' | 'heal' | 'draw' | 'ember' | 'trick'
// power: damage / shield / healing / cards drawn / ember gained, as the kind says.
// extra: 'burn' (2 damage at the start of the victim's next turn),
//        'snare' (victim loses 1 max ember next turn), 'pierce' (ignores shield).
export const CARD_TYPES = [
  { id: 'ember-strike', name: 'Ember Strike', suit: 'flame', cost: 1, kind: 'attack', power: 3, art: '🔥', text: 'Deal 3 damage.' },
  { id: 'fireball', name: 'Fireball', suit: 'flame', cost: 3, kind: 'attack', power: 6, art: '☄️', text: 'Deal 6 damage.' },
  { id: 'ignite', name: 'Ignite', suit: 'flame', cost: 2, kind: 'attack', power: 4, art: '🕯️', text: 'Deal 4 damage. Burn: 2 more next turn.', extra: 'burn' },
  { id: 'tidal-wave', name: 'Tidal Wave', suit: 'tide', cost: 4, kind: 'attack', power: 7, art: '🌊', text: 'Deal 7 damage. Pierces shield.', extra: 'pierce' },
  { id: 'healing-spring', name: 'Healing Spring', suit: 'tide', cost: 2, kind: 'heal', power: 5, art: '💧', text: 'Restore 5 life.' },
  { id: 'deep-draw', name: 'Deep Draw', suit: 'tide', cost: 1, kind: 'draw', power: 2, art: '🎣', text: 'Draw 2 cards.' },
  { id: 'thorn-lash', name: 'Thorn Lash', suit: 'thorn', cost: 2, kind: 'attack', power: 4, art: '🌹', text: 'Deal 4 damage.' },
  { id: 'briar-shield', name: 'Briar Shield', suit: 'thorn', cost: 1, kind: 'guard', power: 5, art: '🛡️', text: 'Gain 5 shield.' },
  { id: 'snare-vine', name: 'Snare Vine', suit: 'thorn', cost: 2, kind: 'trick', power: 3, art: '🕸️', text: 'Deal 3 damage. Snare: foe loses 1 ember next turn.', extra: 'snare' },
  { id: 'boulder', name: 'Boulder', suit: 'stone', cost: 3, kind: 'attack', power: 5, art: '🪨', text: 'Deal 5 damage.' },
  { id: 'stonewall', name: 'Stonewall', suit: 'stone', cost: 2, kind: 'guard', power: 8, art: '🧱', text: 'Gain 8 shield.' },
  { id: 'quarry', name: 'Quarry', suit: 'stone', cost: 1, kind: 'ember', power: 2, art: '⛏️', text: 'Gain 2 ember this turn.' },
  { id: 'ember-spark', name: 'Ember Spark', suit: 'flame', cost: 0, kind: 'ember', power: 1, art: '✨', text: 'Gain 1 ember this turn.' },
  { id: 'focus', name: 'Focus', suit: 'tide', cost: 1, kind: 'draw', power: 1, art: '🔮', text: 'Draw 1 card. Heal 2.' },
];

export function cardById(id) {
  return CARD_TYPES.find((c) => c.id === id);
}

// A fresh 28-card deck: two copies of each type, in catalogue order.
export function buildDeck() {
  const deck = [];
  for (const type of CARD_TYPES) {
    deck.push({ ...type, uid: `${type.id}-a` });
    deck.push({ ...type, uid: `${type.id}-b` });
  }
  return deck;
}

export function kindLabel(kind) {
  return { attack: 'Attack', guard: 'Guard', heal: 'Heal', draw: 'Draw', ember: 'Ember', trick: 'Trick' }[kind] ?? kind;
}
