/**
 * Gestionnaire de rooms Blackjack.
 *
 * Architecture :
 *   rooms        : Map<gameId, BJRoom>    → toutes les rooms actives
 *   socketRoomMap: Map<socketId, gameId>  → retrouver la room d'un socket
 *
 * Flow d'un round :
 *   joinGame      → crée/rejoint une room en 'waiting'
 *   startRound    → distribue les cartes, passe en 'playing'
 *   handleAction  → hit / stand / double / split
 *   _advanceTurn  → trouve le prochain joueur/main (interne)
 *   _dealerTurn   → le dealer joue automatiquement, émet game:over
 */

const { randomUUID } = require('node:crypto');
const {
  createDeck,
  shuffle,
  dealCard,
  isBlackjack,
  isBust,
  shouldDealerDraw,
  canDouble,
  canSplit,
  splitHand,
  determineResult,
} = require('./blackjack.js');

const MAX_PLAYERS = 4;

function createBlackjackManager(walletManager = null) {
  const rooms = new Map();          // gameId → BJRoom
  const socketRoomMap = new Map();  // socketId → gameId

  // ── Factories ────────────────────────────────────────────────────────────────

  function _createHand(cards = [], bet = 0) {
    return { cards, doubled: false, status: 'playing', bet };
  }

  function _createPlayer(socketId) {
    return {
      socketId,
      hands: [_createHand()],
      currentHandIndex: 0,
      result: null,
    };
  }

  // ── Sérialisation ─────────────────────────────────────────────────────────────

  /**
   * Prépare la room pour envoi socket (ne pas envoyer le deck — sécurité).
   */
  function _serialize(room) {
    return {
      gameId: room.gameId,
      phase: room.phase,
      currentPlayerIndex: room.currentPlayerIndex,
      players: room.players.map((p) => ({
        socketId: p.socketId,
        hands: p.hands,
        currentHandIndex: p.currentHandIndex,
        result: p.result,
      })),
      dealerCards: room.dealerCards,
    };
  }

  // ── Gestion du tour ──────────────────────────────────────────────────────────

  /**
   * Trouve le prochain joueur/main à jouer et émet game:update,
   * ou déclenche le tour du dealer si tout le monde a fini.
   *
   * Logique :
   *   1. Chercher une main encore en 'playing' chez le joueur courant
   *      (peut arriver après un split)
   *   2. Chercher un joueur suivant avec des mains encore jouables
   *   3. Si plus personne → tour du dealer
   */
  function _advanceTurn(io, room) {
    const current = room.players[room.currentPlayerIndex];

    // 1. Prochaine main jouable du joueur courant (split)
    for (let i = current.currentHandIndex + 1; i < current.hands.length; i++) {
      if (current.hands[i].status === 'playing') {
        current.currentHandIndex = i;
        io.to(room.gameId).emit('game:update', _serialize(room));
        return;
      }
    }

    // 2. Prochain joueur avec des mains jouables
    for (let i = room.currentPlayerIndex + 1; i < room.players.length; i++) {
      const next = room.players[i];
      const playableHand = next.hands.findIndex((h) => h.status === 'playing');
      if (playableHand !== -1) {
        room.currentPlayerIndex = i;
        next.currentHandIndex = playableHand;
        io.to(room.gameId).emit('game:update', _serialize(room));
        return;
      }
    }

    // 3. Tout le monde a joué → tour du dealer
    _dealerTurn(io, room);
  }

  /**
   * Le dealer joue automatiquement selon les règles casino :
   *   1. Révéler la carte cachée
   *   2. Tirer jusqu'à score ≥ 17 (stand on soft 17)
   *   3. Calculer les résultats pour chaque main de chaque joueur
   *   4. Émettre game:over
   */
  function _dealerTurn(io, room) {
    room.phase = 'dealer-turn';

    // Révéler la carte cachée du dealer
    room.dealerCards = room.dealerCards.map((c) => ({ ...c, hidden: false }));

    // Le dealer tire des cartes jusqu'à score ≥ 17
    while (shouldDealerDraw(room.dealerCards)) {
      const { card, deck } = dealCard(room.deck);
      room.deck = deck;
      room.dealerCards = [...room.dealerCards, card];
    }

    // Calculer les résultats pour chaque main de chaque joueur
    for (const player of room.players) {
      player.result = player.hands.map((hand) => {
        // Bust → toujours perdant (même si dealer bust aussi)
        if (hand.status === 'bust') return 'lose';
        // Blackjack ou score normal → comparaison avec le dealer
        return determineResult(hand.cards, room.dealerCards);
      });
    }

    // Appliquer les gains wallet (la mise a déjà été débitée au startRound)
    if (walletManager) {
      for (const player of room.players) {
        player.result.forEach((result, i) => {
          walletManager.applyBlackjackResult(player.socketId, result, player.hands[i].bet);
        });
        const balance = walletManager.getBalance(player.socketId);
        if (balance !== null) {
          io.to(player.socketId).emit('wallet:update', { balance });
        }
      }
    }

    room.phase = 'over';
    io.to(room.gameId).emit('game:over', {
      players: room.players,
      dealerCards: room.dealerCards,
    });
  }

  // ── API publique ─────────────────────────────────────────────────────────────

  /**
   * Rejoint une room existante en 'waiting' ou en crée une nouvelle.
   * Limite : MAX_PLAYERS (4) par room.
   */
  function joinGame(io, socket) {
    const existingGameId = socketRoomMap.get(socket.id);
    if (existingGameId) {
      const existingRoom = rooms.get(existingGameId);
      // Autoriser le re-join si la partie est terminée
      if (!existingRoom || existingRoom.phase !== 'over') return;
      // Nettoyer l'ancienne room terminée
      socketRoomMap.delete(socket.id);
      existingRoom.players = existingRoom.players.filter((p) => p.socketId !== socket.id);
      if (existingRoom.players.length === 0) rooms.delete(existingGameId);
    }

    // Chercher une room en waiting avec de la place
    let room = null;
    for (const r of rooms.values()) {
      if (r.phase === 'waiting' && r.players.length < MAX_PLAYERS) {
        room = r;
        break;
      }
    }

    if (!room) {
      // Créer une nouvelle room
      const gameId = randomUUID();
      room = {
        gameId,
        phase: 'waiting',
        players: [],
        deck: [],
        dealerCards: [],
        currentPlayerIndex: 0,
      };
      rooms.set(gameId, room);
    }

    // Ajouter le joueur
    room.players.push(_createPlayer(socket.id));
    socketRoomMap.set(socket.id, room.gameId);
    socket.join(room.gameId);

    socket.emit('game:waiting', {
      gameId: room.gameId,
      playerCount: room.players.length,
      message: `En attente... (${room.players.length}/${MAX_PLAYERS} joueurs)`,
    });
  }

  /**
   * Démarre un round : distribue les cartes à tous les joueurs et au dealer.
   *
   * Distribution :
   *   - Chaque joueur reçoit 2 cartes (+ vérif Blackjack naturel)
   *   - Dealer reçoit 2 cartes (la 2ème est cachée — hidden: true)
   *
   * Si un joueur a Blackjack naturel, il passe directement en status 'blackjack'.
   * Si TOUS les joueurs ont Blackjack, on passe directement au tour du dealer.
   */
  /**
   * @param {object} opts
   * @param {string}   opts.gameId
   * @param {object[]} [opts._testDeck] - deck pré-construit (tests uniquement)
   */
  function startRound(io, socket, { gameId, bet = 10, _testDeck } = {}) {
    const room = rooms.get(gameId);
    if (!room || room.phase !== 'waiting') return;
    if (!room.players.find((p) => p.socketId === socket.id)) return;

    // Valider et débiter la mise pour tous les joueurs
    const betAmount = Math.max(5, Math.floor(bet));
    if (walletManager) {
      for (const player of room.players) {
        if (!walletManager.canBet(player.socketId, betAmount)) {
          socket.emit('wallet:bet-refused', { reason: 'Solde insuffisant' });
          return;
        }
      }
      for (const player of room.players) {
        walletManager.debit(player.socketId, betAmount);
      }
    }

    // Deck frais mélangé (ou deck de test injecté)
    room.deck = _testDeck ?? shuffle(createDeck());
    room.phase = 'playing';
    room.currentPlayerIndex = 0;

    // Distribuer 2 cartes à chaque joueur
    for (const player of room.players) {
      player.hands = [_createHand([], betAmount)];
      player.currentHandIndex = 0;
      player.result = null;

      for (let i = 0; i < 2; i++) {
        const { card, deck } = dealCard(room.deck);
        room.deck = deck;
        player.hands[0].cards = [...player.hands[0].cards, card];
      }

      // Blackjack naturel dès la donne
      if (isBlackjack(player.hands[0].cards)) {
        player.hands[0].status = 'blackjack';
      }
    }

    // Dealer : 2 cartes, la 2ème cachée
    const { card: d1, deck: deckD1 } = dealCard(room.deck);
    const { card: d2, deck: deckD2 } = dealCard(deckD1);
    room.deck = deckD2;
    room.dealerCards = [d1, { ...d2, hidden: true }];

    // Si tous les joueurs ont Blackjack → passer directement au dealer
    if (room.players.every((p) => p.hands[0].status === 'blackjack')) {
      io.to(gameId).emit('game:start', _serialize(room));
      _dealerTurn(io, room);
      return;
    }

    // Avancer vers le 1er joueur qui n'a pas de Blackjack naturel
    while (
      room.currentPlayerIndex < room.players.length &&
      room.players[room.currentPlayerIndex].hands[0].status === 'blackjack'
    ) {
      room.currentPlayerIndex++;
    }

    io.to(gameId).emit('game:start', _serialize(room));
  }

  /**
   * Traite une action joueur : hit / stand / double / split.
   *
   * Vérifications de sécurité :
   *   - La room existe et est en phase 'playing'
   *   - C'est bien le tour du socket appelant
   *   - La main courante est en statut 'playing' (pas déjà terminée)
   */
  function handleAction(io, socket, { gameId, action } = {}) {
    const room = rooms.get(gameId);
    if (!room || room.phase !== 'playing') return;

    const player = room.players[room.currentPlayerIndex];
    if (!player || player.socketId !== socket.id) return;

    const hand = player.hands[player.currentHandIndex];
    if (!hand || hand.status !== 'playing') return;

    if (action === 'hit') {
      // ── Hit : tirer une carte ─────────────────────────────────────────────
      const { card, deck } = dealCard(room.deck);
      room.deck = deck;
      hand.cards = [...hand.cards, card];

      if (isBust(hand.cards)) hand.status = 'bust';

      io.to(gameId).emit('game:update', _serialize(room));
      if (hand.status !== 'playing') _advanceTurn(io, room);

    } else if (action === 'stand') {
      // ── Stand : rester, passer au suivant ────────────────────────────────
      hand.status = 'stand';
      io.to(gameId).emit('game:update', _serialize(room));
      _advanceTurn(io, room);

    } else if (action === 'double') {
      // ── Double Down : 1 seule carte, puis stand forcé ─────────────────────
      if (!canDouble(hand.cards)) return;
      // Débiter la mise supplémentaire (= mise initiale de la main)
      if (walletManager && !walletManager.debit(player.socketId, hand.bet)) return;
      const { card, deck } = dealCard(room.deck);
      room.deck = deck;
      hand.cards = [...hand.cards, card];
      hand.bet = hand.bet * 2;
      hand.doubled = true;
      hand.status = isBust(hand.cards) ? 'bust' : 'doubled';
      io.to(gameId).emit('game:update', _serialize(room));
      _advanceTurn(io, room);

    } else if (action === 'split') {
      // ── Split : séparer la paire en deux mains ────────────────────────────
      // Chaque nouvelle main reçoit 1 carte supplémentaire immédiatement.
      if (!canSplit(hand.cards)) return;
      // Débiter la mise de la 2ème main créée par le split
      if (walletManager && !walletManager.debit(player.socketId, hand.bet)) return;
      const [h1Cards, h2Cards] = splitHand(hand.cards);

      const { card: c1, deck: d1 } = dealCard(room.deck);
      room.deck = d1;
      const { card: c2, deck: d2 } = dealCard(room.deck);
      room.deck = d2;

      player.hands = [
        _createHand([...h1Cards, c1], hand.bet),
        _createHand([...h2Cards, c2], hand.bet),
      ];
      player.currentHandIndex = 0;
      io.to(gameId).emit('game:update', _serialize(room));
    }
  }

  /**
   * Quitter la room.
   * - En 'waiting' : retire le joueur, met à jour les autres
   * - En cours : termine la partie pour tout le monde
   */
  function handleLeaveGame(io, socket, options = {}) {
    const gameId = (options && options.gameId) || socketRoomMap.get(socket.id);
    socketRoomMap.delete(socket.id);

    const room = rooms.get(gameId);
    if (!room) return;

    room.players = room.players.filter((p) => p.socketId !== socket.id);

    if (room.players.length === 0) {
      rooms.delete(gameId);
      return;
    }

    if (room.phase !== 'waiting') {
      // Partie en cours → fin pour tous
      for (const p of room.players) socketRoomMap.delete(p.socketId);
      rooms.delete(gameId);
      io.to(gameId).emit('game:over', {
        players: room.players,
        dealerCards: room.dealerCards,
        reason: 'opponent-left',
      });
    } else {
      // En attente → mettre à jour le compteur
      io.to(gameId).emit('game:waiting', {
        gameId: room.gameId,
        playerCount: room.players.length,
        message: `En attente... (${room.players.length}/${MAX_PLAYERS} joueurs)`,
      });
    }
  }

  function handleDisconnect(io, socket) {
    handleLeaveGame(io, socket);
  }

  function getRoom(gameId) {
    return rooms.get(gameId);
  }

  return {
    joinGame,
    startRound,
    handleAction,
    handleLeaveGame,
    handleDisconnect,
    getRoom,
  };
}

module.exports = { createBlackjackManager };
