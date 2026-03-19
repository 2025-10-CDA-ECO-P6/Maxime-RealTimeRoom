const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

function shuffle(deck) {
  const arr = [...deck]; // copie — immuabilité
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]; // destructuring swap
  }
  return arr;
}

function dealCard(deck) {
  const [card, ...rest] = deck;
  return { card, deck: rest };
}

function getCardValue(card) {
  if (card.rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  return parseInt(card.rank, 10);
}

function calculateScore(cards) {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    score += getCardValue(card);
    if (card.rank === 'A') aces++;
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

function isBlackjack(cards) {
  return cards.length === 2 && calculateScore(cards) === 21;
}

function isBust(cards) {
  return calculateScore(cards) > 21;
}

function shouldDealerDraw(cards) {
  return calculateScore(cards) < 17;
}

function canDouble(cards) {
  return cards.length === 2;
}

function canSplit(cards) {
  return cards.length === 2 && cards[0].rank === cards[1].rank;
}

function splitHand(cards) {
  return [[cards[0]], [cards[1]]];
}

function determineResult(playerCards, dealerCards) {
  if (isBust(playerCards)) return 'lose';
  if (isBust(dealerCards)) return 'win';

  const playerBJ = isBlackjack(playerCards);
  const dealerBJ = isBlackjack(dealerCards);

  if (playerBJ && dealerBJ) return 'push';
  if (playerBJ) return 'blackjack';

  const playerScore = calculateScore(playerCards);
  const dealerScore = calculateScore(dealerCards);

  if (playerScore > dealerScore) return 'win';
  if (playerScore < dealerScore) return 'lose';
  return 'push';
}

module.exports = {
  createDeck,
  shuffle,
  dealCard,
  getCardValue,
  calculateScore,
  isBlackjack,
  isBust,
  shouldDealerDraw,
  canDouble,
  canSplit,
  splitHand,
  determineResult,
};
