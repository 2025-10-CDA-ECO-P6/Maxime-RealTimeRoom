/**
 * walletManager — Gestion des soldes en mémoire session
 *
 * Règles métier :
 *   - Solde initial : 100 pièces
 *   - Tic-Tac-Toe victoire : +10 | nul : +3 | défaite : 0
 *   - Blackjack win : +mise | blackjack naturel : +mise×1.5 | push : récupère mise | lose : perd mise
 */
function createWalletManager() {
  // Map socketId → balance (number)
  const balances = new Map();

  /**
   * Initialise le wallet d'un socket s'il n'existe pas encore.
   * Idempotent : un deuxième appel ne réinitialise pas le solde.
   */
  function init(socketId) {
    if (!balances.has(socketId)) {
      balances.set(socketId, 100);
    }
  }

  /** Retourne le solde, ou null si le socket n'existe pas */
  function getBalance(socketId) {
    return balances.has(socketId) ? balances.get(socketId) : null;
  }

  /** Ajoute des pièces au solde (ne fait rien si socket inconnu) */
  function credit(socketId, amount) {
    if (!balances.has(socketId)) return;
    balances.set(socketId, balances.get(socketId) + amount);
  }

  /**
   * Retire des pièces du solde.
   * Retourne true si réussi, false si solde insuffisant (ne mute pas).
   */
  function debit(socketId, amount) {
    if (!balances.has(socketId)) return false;
    const current = balances.get(socketId);
    if (amount > current) return false;
    balances.set(socketId, current - amount);
    return true;
  }

  /**
   * Vérifie qu'une mise est valide :
   *   - socket connu
   *   - amount > 0
   *   - amount <= solde
   */
  function canBet(socketId, amount) {
    if (!balances.has(socketId)) return false;
    if (amount <= 0) return false;
    return amount <= balances.get(socketId);
  }

  /**
   * Applique le résultat d'une main de Blackjack.
   * La mise a déjà été débitée au moment du startRound.
   *
   * win       → remboursement mise + gain équivalent (×2 total)
   * blackjack → remboursement mise + gain 1.5× (paiement 3:2)
   * push      → remboursement mise seule (×1 total)
   * lose      → rien (mise déjà perdue)
   */
  function applyBlackjackResult(socketId, result, bet) {
    switch (result) {
      case 'win':
        credit(socketId, bet * 2); // mise récupérée + gain
        break;
      case 'blackjack':
        credit(socketId, bet + Math.floor(bet * 1.5)); // mise + 1.5×
        break;
      case 'push':
        credit(socketId, bet); // remboursement
        break;
      case 'lose':
        // mise déjà débitée, rien à faire
        break;
    }
  }

  /** Supprime le wallet d'un socket (déconnexion) */
  function remove(socketId) {
    balances.delete(socketId);
  }

  return { init, getBalance, credit, debit, canBet, applyBlackjackResult, remove };
}

module.exports = { createWalletManager };
