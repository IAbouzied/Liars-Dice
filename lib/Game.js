var Player = require('./Player');
var HashMap = require('hashmap');

function Game() {
    this.players = new HashMap();
    this.clients = new HashMap();
    this.playerIDs = [];
    this.turnIndex = 0;
}

Game.prototype.addPlayer = function(socket, name) {
    var isTurn = (this.players.size == 0) ? true : false;
    this.players.set(socket.id, new Player(socket, name, isTurn));
    this.clients.set(socket.id, socket);
    this.playerIDs = this.players.values().map((player) => {return player.socketID});

    console.log(`${name} has connected`);
}

Game.prototype.removePlayer = function(socket) {
    if (this.players.has(socket.id)) {
        var username = this.players.get(socket.id).name;
        this.players.delete(socket.id);
        this.clients.delete(socket.id);
        this.playerIDs = this.players.values().map((player) => {return player.socketID});

        console.log(`${username} has disconnected`);
    }
}

Game.prototype.getPlayers = function() {
    return this.players.values();
}

Game.prototype.nextPlayerTurn = function () {
    console.log("turnIndex", this.turnIndex);
    this.turnIndex = (this.turnIndex + 1) % this.playerIDs.length;
    console.log("Player IDs", this.playerIDs);
    console.log("turnIndex", this.turnIndex);
    this.players.get(this.playerIDs[this.turnIndex]).isTurn = true;
}

Game.prototype.raise = function(socketID) {
    var player =  this.players.get(socketID);
    console.log(`${player.name} has raised`);
    // Verify it is the players turn
    if (player.isTurn) {
        console.log("Verified player should raise");
        player.isTurn = false;
        this.nextPlayerTurn();
    }
}

module.exports = Game
