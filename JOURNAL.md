# Journal d'itération — Tic-Tac-Toe TDD

## Règles métier identifiées

### Règles du plateau

| ID | Règle | Priorité |
|----|-------|----------|
| B1 | Le plateau démarre avec 9 cases vides (null) | Critique |
| B2 | Un coup est valide uniquement sur une case vide (0–8) | Critique |
| B3 | Un coup hors des indices 0–8 est invalide | Critique |
| B4 | Placer un symbole crée un nouveau plateau (immutabilité) | Important |
| B5 | Jouer sur une case occupée lève une erreur | Critique |

### Règles de victoire

| ID | Règle | Priorité |
|----|-------|----------|
| V1 | 3 symboles identiques sur une ligne horizontale → victoire | Critique |
| V2 | 3 symboles identiques sur une colonne verticale → victoire | Critique |
| V3 | 3 symboles identiques sur une diagonale → victoire | Critique |
| V4 | Plateau sans alignement → pas de vainqueur | Critique |
| V5 | Plateau plein sans vainqueur → match nul (Draw) | Important |
| V6 | Plateau plein avec vainqueur → pas un Draw | Important |

### Règles du matchmaking

| ID | Règle | Priorité |
|----|-------|----------|
| M1 | Le 1er joueur est mis en file d'attente | Critique |
| M2 | Le 2ème joueur déclenche le démarrage de partie | Critique |
| M3 | La file est vidée après l'appariement | Important |
| M4 | Les deux joueurs rejoignent la même room Socket.io | Critique |

### Règles de tour de jeu

| ID | Règle | Priorité |
|----|-------|----------|
| T1 | Seul le joueur dont c'est le tour peut jouer | Critique |
| T2 | Après chaque coup valide, c'est le tour de l'adversaire | Critique |
| T3 | Un coup gagnant émet game:over avec le vainqueur | Critique |
| T4 | Un plateau plein émet game:over avec isDraw:true | Important |

### Règles de reset

| ID | Règle | Priorité |
|----|-------|----------|
| R1 | Un reset remet le plateau à 9 cases vides | Critique |
| R2 | Un reset réémet game:start dans la même room | Critique |

---

## Tests associés à chaque règle

### `api/__tests__/tictactoe.test.js` (18 tests)

| Test | Règles couvertes |
|------|-----------------|
| createBoard retourne 9 null | B1 |
| isValidMove vrai pour case vide | B2 |
| isValidMove faux si case occupée | B2, B5 |
| isValidMove faux si index > 8 | B3 |
| isValidMove faux si index < 0 | B3 |
| makeMove place le symbole | B4 |
| makeMove est immutable | B4 |
| makeMove throw si case occupée | B5 |
| makeMove throw si index invalide | B3, B5 |
| checkWinner null sans vainqueur | V4 |
| checkWinner victoire horizontale X | V1 |
| checkWinner victoire horizontale O | V1 |
| checkWinner victoire verticale X | V2 |
| checkWinner victoire diagonale O | V3 |
| checkWinner victoire diagonale principale X | V3 |
| isDraw vrai si plateau plein sans vainqueur | V5 |
| isDraw faux si cases vides | V5 |
| isDraw faux si plateau plein avec vainqueur | V6 |

### `api/__tests__/gameSocket.test.js` (6 tests)

| Test | Règles couvertes |
|------|-----------------|
| 1er game:join → game:waiting | M1 |
| 2ème game:join → game:start + file vide | M2, M3, M4 |
| game:move valide → game:update | T2 |
| game:move mauvais joueur ignoré | T1 |
| game:move gagnant → game:over | T3 |
| game:reset → nouveau plateau + game:start | R1, R2 |

### `web/src/__tests__/gameLogic.test.ts` (8 tests)

| Test | Règles couvertes |
|------|-----------------|
| getGamePhase null → idle | — (état UI) |
| getGamePhase waiting → waiting | — (état UI) |
| getGamePhase playing, mon tour | T1 |
| getGamePhase playing, tour adverse | T1 |
| isMyTurn vrai | T1 |
| isMyTurn faux | T1 |
| getWinningCells [0,1,2] pour ligne 0 | V1 |
| getWinningCells [] sans vainqueur | V4 |

### `web/src/__tests__/GameBoard.test.tsx` (5 tests)

Tests de rendu et d'interaction UI du composant grille.

### `web/src/__tests__/GameStatus.test.tsx` (6 tests)

Tests d'affichage des messages selon la phase de jeu.

---

## Étapes d'implémentation (RED → GREEN)

### Commit 1 — Infrastructure + Tests RED

1. Ajout de Vitest dans `api/package.json` et `web/package.json`
2. Configuration de `web/vite.config.ts` avec `test: { environment: 'jsdom' }`
3. Création de `web/src/test/setup.ts` (import @testing-library/jest-dom)
4. Ajout de `"test": "pnpm -r run test"` à la racine
5. Écriture de `api/__tests__/tictactoe.test.js` (18 tests — échouent)
6. Écriture de `api/__tests__/gameSocket.test.js` (6 tests — échouent)
7. Écriture de `web/src/__tests__/gameLogic.test.ts` (8 tests — échouent)
8. Écriture de `web/src/__tests__/GameBoard.test.tsx` (5 tests — échouent)
9. Écriture de `web/src/__tests__/GameStatus.test.tsx` (6 tests — échouent)

**Résultat :** 5 suites en échec, 0 test passant.

### Commit 2 — Implémentation GREEN

**Backend :**

1. `api/src/game/tictactoe.js` — fonctions pures :
   - `createBoard()`, `isValidMove()`, `makeMove()`, `checkWinner()`, `isDraw()`, `getWinningLine()`
   - Immutabilité garantie par spread `[...board]`
   - `module.exports` CJS pour compatibilité avec `index.js`

2. `api/src/game/gameManager.js` — factory `createGameManager()` :
   - Pattern factory → chaque test obtient un état isolé
   - `waitingSocket` stocke l'objet socket complet (pas juste l'id) pour pouvoir appeler `.join()`
   - `Map<gameId, GameState>` pour les parties actives
   - `handleDisconnect` nettoie la file ET notifie l'adversaire

3. `api/index.js` — câblage des événements `game:join/move/reset`

**Frontend :**

4. `web/src/types/game.ts` — types TypeScript partagés
5. `web/src/utils/gameLogic.ts` — `getGamePhase()`, `isMyTurn()`, `getWinningCells()`
6. Composants : `GameCell`, `GameBoard`, `GameStatus`, `GameControls`, `GameArea`
7. `web/src/hooks/useGame.ts` — intégration Socket.io + état React
8. `web/src/pages/Chat.tsx` — layout 3 colonnes (sidebar + jeu + chat)
9. `web/src/pages/Chat.css` — largeur 850px → 1100px, nouvelle classe `.skype-chat-sidebar`

**Documentation :**

10. `README.md` — règles du jeu, lancement, tests, démarche TDD
11. `JOURNAL.md` — ce fichier

**Résultat :** 5 suites passées, 43 tests passants (24 API + 19 frontend).
