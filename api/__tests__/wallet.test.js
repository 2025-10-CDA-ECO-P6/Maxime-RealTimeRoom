const { createWalletManager } = require('../src/game/walletManager');

describe('walletManager', () => {
  let wallet;
  beforeEach(() => {
    wallet = createWalletManager();
  });

  describe('init / getBalance', () => {
    test('solde initial est 100 pièces', () => {
      wallet.init('socket-1');
      expect(wallet.getBalance('socket-1')).toBe(100);
    });

    test('getBalance retourne null si socket inconnu', () => {
      expect(wallet.getBalance('inexistant')).toBeNull();
    });

    test('init deux fois ne réinitialise pas le solde', () => {
      wallet.init('socket-1');
      wallet.credit('socket-1', 50);
      wallet.init('socket-1'); // deuxième init → ne doit pas reset
      expect(wallet.getBalance('socket-1')).toBe(150);
    });
  });

  describe('credit', () => {
    test('credit ajoute des pièces au solde', () => {
      wallet.init('socket-1');
      wallet.credit('socket-1', 10);
      expect(wallet.getBalance('socket-1')).toBe(110);
    });

    test('credit de 0 ne change pas le solde', () => {
      wallet.init('socket-1');
      wallet.credit('socket-1', 0);
      expect(wallet.getBalance('socket-1')).toBe(100);
    });

    test('credit sur socket inconnu ne lève pas d\'erreur', () => {
      expect(() => wallet.credit('inconnu', 10)).not.toThrow();
    });
  });

  describe('debit', () => {
    test('debit retire des pièces du solde', () => {
      wallet.init('socket-1');
      wallet.debit('socket-1', 30);
      expect(wallet.getBalance('socket-1')).toBe(70);
    });

    test('debit ne peut pas mettre le solde en négatif', () => {
      wallet.init('socket-1');
      const success = wallet.debit('socket-1', 200);
      expect(success).toBe(false);
      expect(wallet.getBalance('socket-1')).toBe(100);
    });

    test('debit retourne true si réussi', () => {
      wallet.init('socket-1');
      const success = wallet.debit('socket-1', 50);
      expect(success).toBe(true);
      expect(wallet.getBalance('socket-1')).toBe(50);
    });
  });

  describe('canBet', () => {
    test('canBet retourne true si solde suffisant', () => {
      wallet.init('socket-1');
      expect(wallet.canBet('socket-1', 100)).toBe(true);
    });

    test('canBet retourne false si mise > solde', () => {
      wallet.init('socket-1');
      expect(wallet.canBet('socket-1', 101)).toBe(false);
    });

    test('canBet retourne false si mise <= 0', () => {
      wallet.init('socket-1');
      expect(wallet.canBet('socket-1', 0)).toBe(false);
      expect(wallet.canBet('socket-1', -5)).toBe(false);
    });

    test('canBet retourne false si socket inconnu', () => {
      expect(wallet.canBet('inconnu', 10)).toBe(false);
    });
  });

  describe('applyBlackjackResult', () => {
    test('win → reçoit la mise', () => {
      wallet.init('socket-1');
      wallet.debit('socket-1', 20); // mise de 20
      wallet.applyBlackjackResult('socket-1', 'win', 20);
      // 100 - 20 + 20 (mise récupérée) + 20 (gain) = 120
      expect(wallet.getBalance('socket-1')).toBe(120);
    });

    test('blackjack → reçoit mise × 2.5 (paiement 3:2)', () => {
      wallet.init('socket-1');
      wallet.debit('socket-1', 20);
      wallet.applyBlackjackResult('socket-1', 'blackjack', 20);
      // 100 - 20 + 20 + 30 (gain 1.5×) = 130
      expect(wallet.getBalance('socket-1')).toBe(130);
    });

    test('push → récupère la mise sans gain', () => {
      wallet.init('socket-1');
      wallet.debit('socket-1', 20);
      wallet.applyBlackjackResult('socket-1', 'push', 20);
      // 100 - 20 + 20 = 100
      expect(wallet.getBalance('socket-1')).toBe(100);
    });

    test('lose → perd la mise (déjà débitée, rien à créditer)', () => {
      wallet.init('socket-1');
      wallet.debit('socket-1', 20);
      wallet.applyBlackjackResult('socket-1', 'lose', 20);
      // 100 - 20 = 80
      expect(wallet.getBalance('socket-1')).toBe(80);
    });
  });

  describe('remove', () => {
    test('remove supprime le wallet du socket', () => {
      wallet.init('socket-1');
      wallet.remove('socket-1');
      expect(wallet.getBalance('socket-1')).toBeNull();
    });
  });
});
