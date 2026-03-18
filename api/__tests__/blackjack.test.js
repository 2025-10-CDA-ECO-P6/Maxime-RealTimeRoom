/**
 * Tests RED — Logique pure du Blackjack
 *
 * Chaque describe correspond à une catégorie de règles métier.
 * Ces tests définissent le CONTRAT des fonctions avant leur implémentation.
 */
import { describe, test, expect } from 'vitest';
import {
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
} from '../src/game/blackjack.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers pour créer des cartes de test facilement
// ─────────────────────────────────────────────────────────────────────────────
const card = (rank, suit = 'spades') => ({ rank, suit });
const A  = card('A');
const K  = card('K');
const Q  = card('Q');
const J  = card('J');
const T  = card('10');
const c9 = card('9');
const c8h = card('8', 'hearts');
const c8s = card('8', 'spades');
const c5 = card('5');
const c2 = card('2');

// ─────────────────────────────────────────────────────────────────────────────
// Deck — création et mélange
// ─────────────────────────────────────────────────────────────────────────────
describe('createDeck', () => {
  test('retourne 52 cartes', () => {
    expect(createDeck()).toHaveLength(52);
  });

  test('contient 4 couleurs × 13 rangs (pas de doublons)', () => {
    const deck = createDeck();
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

    for (const suit of suits) {
      for (const rank of ranks) {
        const count = deck.filter(c => c.suit === suit && c.rank === rank).length;
        expect(count, `${rank} of ${suit}`).toBe(1);
      }
    }
  });
});

describe('shuffle', () => {
  test('retourne un tableau de 52 cartes', () => {
    const deck = createDeck();
    expect(shuffle(deck)).toHaveLength(52);
  });

  test('ne mute pas le deck original', () => {
    const deck = createDeck();
    const copy = [...deck];
    shuffle(deck);
    expect(deck).toEqual(copy);
  });

  test('contient les mêmes cartes dans un ordre différent (dans 99% des cas)', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    // Même contenu (tri pour comparaison indépendante de l'ordre)
    const sort = (d) => [...d].sort((a, b) => `${a.suit}${a.rank}`.localeCompare(`${b.suit}${b.rank}`));
    expect(sort(shuffled)).toEqual(sort(deck));
    // Ordre différent (probabilité d'être identique = 1/52! ≈ 0)
    expect(shuffled).not.toEqual(deck);
  });
});

describe('dealCard', () => {
  test('retourne la première carte et un deck de 51 cartes', () => {
    const deck = createDeck();
    const result = dealCard(deck);
    expect(result).toHaveProperty('card');
    expect(result).toHaveProperty('deck');
    expect(result.deck).toHaveLength(51);
    expect(result.card).toEqual(deck[0]);
  });

  test('ne mute pas le deck original', () => {
    const deck = createDeck();
    const copy = [...deck];
    dealCard(deck);
    expect(deck).toEqual(copy);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Score — la règle de l'As est la plus importante du Blackjack
//
// L'As vaut 11 par défaut. S'il fait dépasser 21, il revient à 1.
// Il peut y avoir plusieurs As dans une main.
// ─────────────────────────────────────────────────────────────────────────────
describe('getCardValue', () => {
  test('cartes numériques → valeur face', () => {
    expect(getCardValue(card('2'))).toBe(2);
    expect(getCardValue(card('9'))).toBe(9);
  });

  test('10, J, Q, K → 10', () => {
    expect(getCardValue(T)).toBe(10);
    expect(getCardValue(J)).toBe(10);
    expect(getCardValue(Q)).toBe(10);
    expect(getCardValue(K)).toBe(10);
  });

  test('A → 11 (valeur initiale avant ajustement)', () => {
    expect(getCardValue(A)).toBe(11);
  });
});

describe('calculateScore', () => {
  test('[A] → 11 (As souple)', () => {
    expect(calculateScore([A])).toBe(11);
  });

  test('[A, 9] → 20 (As = 11, total ≤ 21)', () => {
    expect(calculateScore([A, c9])).toBe(20);
  });

  test('[A, 9, 5] → 15 (As reclassé à 1 pour éviter le bust)', () => {
    expect(calculateScore([A, c9, c5])).toBe(15);
  });

  test('[A, A] → 12 (1er As = 11, 2ème As = 1)', () => {
    expect(calculateScore([A, A])).toBe(12);
  });

  test('[A, A, 9] → 21 (1er As = 11, 2ème = 1 → 11+1+9 = 21)', () => {
    expect(calculateScore([A, A, c9])).toBe(21);
  });

  test('[K, Q] → 20 (deux figures)', () => {
    expect(calculateScore([K, Q])).toBe(20);
  });

  test('[A, K] → 21 (Blackjack naturel)', () => {
    expect(calculateScore([A, K])).toBe(21);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Statuts de main
// ─────────────────────────────────────────────────────────────────────────────
describe('isBlackjack', () => {
  test('[A, K] → true (As + figure en 2 cartes)', () => {
    expect(isBlackjack([A, K])).toBe(true);
  });

  test('[A, 10] → true (As + 10 en 2 cartes)', () => {
    expect(isBlackjack([A, T])).toBe(true);
  });

  test('[A, K, 2] → false (3 cartes, même si score = 13 après bust... ou 13)', () => {
    // 3 cartes : pas un Blackjack même si score serait 21 avec [A,10,?]
    expect(isBlackjack([A, K, c2])).toBe(false);
  });

  test('[10, J] → false (pas d\'As)', () => {
    expect(isBlackjack([T, J])).toBe(false);
  });
});

describe('isBust', () => {
  test('[K, Q, 5] → true (score = 25 > 21)', () => {
    expect(isBust([K, Q, c5])).toBe(true);
  });

  test('[K, 8] → false (score = 18)', () => {
    expect(isBust([K, c8s])).toBe(false);
  });

  test('[A, K, 5] → false (As reclassé : 1+10+5 = 16)', () => {
    expect(isBust([A, K, c5])).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dealer — règle : tirer jusqu'à score ≥ 17 (stand on soft 17)
// ─────────────────────────────────────────────────────────────────────────────
describe('shouldDealerDraw', () => {
  test('[A, 5] → true (soft 16 < 17)', () => {
    expect(shouldDealerDraw([A, c5])).toBe(true);
  });

  test('[A, 6] → false (soft 17 : le dealer s\'arrête)', () => {
    expect(shouldDealerDraw([A, card('6')])).toBe(false);
  });

  test('[K, 7] → false (hard 17)', () => {
    expect(shouldDealerDraw([K, card('7')])).toBe(false);
  });

  test('[K, 6] → true (hard 16 < 17)', () => {
    expect(shouldDealerDraw([K, card('6')])).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Actions joueur — Double et Split
// ─────────────────────────────────────────────────────────────────────────────
describe('canDouble', () => {
  test('[A, K] → true (exactement 2 cartes)', () => {
    expect(canDouble([A, K])).toBe(true);
  });

  test('[A, K, 2] → false (3 cartes : trop tard pour doubler)', () => {
    expect(canDouble([A, K, c2])).toBe(false);
  });

  test('[K] → false (1 seule carte)', () => {
    expect(canDouble([K])).toBe(false);
  });
});

describe('canSplit', () => {
  test('[8♥, 8♠] → true (même rang)', () => {
    expect(canSplit([c8h, c8s])).toBe(true);
  });

  test('[A, A] → true (deux As)', () => {
    expect(canSplit([A, A])).toBe(true);
  });

  test('[A, K] → false (rangs différents, même si même valeur)', () => {
    expect(canSplit([A, K])).toBe(false);
  });

  test('[K, Q, J] → false (3 cartes)', () => {
    expect(canSplit([K, Q, J])).toBe(false);
  });
});

describe('splitHand', () => {
  test('sépare [8♥, 8♠] en deux mains de 1 carte chacune', () => {
    const [hand1, hand2] = splitHand([c8h, c8s]);
    expect(hand1).toEqual([c8h]);
    expect(hand2).toEqual([c8s]);
  });

  test('ne mute pas la main originale', () => {
    const original = [c8h, c8s];
    const copy = [...original];
    splitHand(original);
    expect(original).toEqual(copy);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Résultat — comparaison joueur vs dealer
// ─────────────────────────────────────────────────────────────────────────────
describe('determineResult', () => {
  test('joueur bust → "lose" (même si dealer bust aussi)', () => {
    expect(determineResult([K, Q, c5], [K, c2])).toBe('lose');
  });

  test('dealer bust, joueur sain → "win"', () => {
    expect(determineResult([K, c8s], [K, Q, c5])).toBe('win');
  });

  test('joueur Blackjack, dealer non → "blackjack" (payout 3:2)', () => {
    expect(determineResult([A, K], [K, c9])).toBe('blackjack');
  });

  test('joueur Blackjack, dealer Blackjack → "push" (égalité)', () => {
    expect(determineResult([A, K], [A, Q])).toBe('push');
  });

  test('score joueur > score dealer → "win"', () => {
    expect(determineResult([K, c9], [K, c8s])).toBe('win'); // 19 vs 18
  });

  test('score joueur < score dealer → "lose"', () => {
    expect(determineResult([K, c8s], [K, c9])).toBe('lose'); // 18 vs 19
  });

  test('scores égaux → "push"', () => {
    expect(determineResult([K, c9], [K, c9])).toBe('push'); // 19 vs 19
  });
});
