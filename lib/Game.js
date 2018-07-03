var Player = require('./Player');
var HashMap = require('hashmap');

function Game() {
    this.players = new HashMap();
}

Game.prototype.addPlayer = function(socket) {
    this.players.set(socket.id, new Player(socket));
    console.log(`Player ${socket.id} connected`);
}

Game.prototype.removePlayer = function(socket) {
    this.players.delete(socket.id);
    console.log(`Player ${socket.id} disconnected`);
}

module.exports = Game
