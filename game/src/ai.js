// Warden Vex, the AI rival: picks cards with a readable, counterable plan.
//   1. If it can finish you this turn, it does.
//   2. If its life is low, it guards or heals.
//   3. Otherwise it plays its strongest affordable attacks, saving ember for a
//      same-suit Resonance pair when one is in hand.
// It never sees your hand — only your life, shield and ember.

export function chooseAiPlays(game) {
  const foe = game.foe;
  const you = game.player;
  const plays = [];
  let ember = foe.ember;
  const hand = foe.hand.slice();

  const affordable = () => hand.filter((c) => c.cost <= ember);
  const lethal = (c) => {
    const power = c.power + (foe.playedSuitsThisTurn.includes(c.suit) ? 2 : 0);
    return c.kind === 'attack' && power >= you.life + you.shield;
  };

  // 1. Lethal first.
  const finisher = affordable().find(lethal);
  if (finisher) {
    plays.push(finisher.uid);
    return plays;
  }

  // 2. Panic defence when hurt.
  if (foe.life <= 10) {
    const defence = affordable()
      .filter((c) => c.kind === 'guard' || c.kind === 'heal')
      .sort((a, b) => b.power - a.power)[0];
    if (defence) {
      plays.push(defence.uid);
      ember -= defence.cost;
      hand.splice(hand.indexOf(defence), 1);
    }
  }

  // 3. Attacks, best damage per ember first; hold a same-suit partner for Resonance.
  const attacks = affordable()
    .filter((c) => c.kind === 'attack' || c.kind === 'trick')
    .sort((a, b) => b.power / b.cost - a.power / a.cost);
  for (const card of attacks) {
    if (plays.length >= 3) break;
    if (card.cost > ember) continue;
    const partner = hand.find(
      (c) => c !== card && c.suit === card.suit && c.cost <= ember - card.cost,
    );
    plays.push(card.uid);
    ember -= card.cost;
    hand.splice(hand.indexOf(card), 1);
    if (partner) {
      plays.push(partner.uid);
      ember -= partner.cost;
      hand.splice(hand.indexOf(partner), 1);
    }
  }

  // 4. Spend leftover ember on cheap utility.
  const utility = hand
    .filter((c) => c.cost <= ember && (c.kind === 'ember' || c.kind === 'draw'))
    .sort((a, b) => a.cost - b.cost)[0];
  if (utility && plays.length < 3) plays.push(utility.uid);

  return plays;
}

// Run the foe's whole turn: choose plays and apply them one by one.
// The caller (main.js) handles the turn handover afterwards.
export function runAiTurn(game, playOne) {
  const uids = chooseAiPlays(game);
  for (const uid of uids) {
    if (game.phase !== 'playing') break;
    playOne(uid);
  }
  return uids;
}
