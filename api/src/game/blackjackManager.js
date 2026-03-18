// Stub — sera implémenté en Phase 2 (GREEN)
function createBlackjackManager() {
  const rooms = new Map();             // gameId → BJRoom
  const socketRoomMap = new Map();     // socketId → gameId

  function joinGame(_io, _socket) {}
  function startRound(_io, _socket, _data) {}
  function handleAction(_io, _socket, _data) {}
  function handleLeaveGame(_io, _socket, _options) {}
  function handleDisconnect(_io, _socket) {}
  function getRoom(gameId) { return rooms.get(gameId); }

  return { joinGame, startRound, handleAction, handleLeaveGame, handleDisconnect, getRoom };
}

module.exports = { createBlackjackManager };
