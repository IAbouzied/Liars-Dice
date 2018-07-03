var Player = require('./Player');
var HashMap = require('hashmap');

function Game() {
    this.players = new HashMap();
}

Game.prototype.addPlayer = function(socket, name) {
    this.players.set(socket.id, new Player(socket, name));
    console.log(`${name} has connected`);
}

Game.prototype.removePlayer = function(socket) {
    if (this.players.has(socket.id)) {
        var username = this.players.get(socket.id).name;
        this.players.delete(socket.id);
        console.log(`${username} has disconnected`);
    }
}

Game.prototype.getPlayerNames = function() {
    return this.players.values().map((player) => { return player.name});
}

module.exports = Game
