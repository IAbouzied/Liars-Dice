var Player = require('./Player');
var HashMap = require('hashmap');

function Game() {
    this.players = new HashMap();
    this.clients = new HashMap();
    this.playerIDs = [];
    this.turnIndex = 0;
    this.gameStarted = false;

    this.bidAmount = 0;
    this.bidFace = 0;
}

Game.prototype.addPlayer = function(socket, name) {
    var isTurn = (this.players.size == 0) ? true : false;
    if (isTurn) socket.emit('notify-host');
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
        var deleted_player = this.playerIDs.indexOf(socket.id);
        this.playerIDs = this.players.values().map((player) => {return player.socketID});
        if (deleted_player < this.turnIndex) {
            this.turnIndex--;
        } 
        else if (deleted_player == this.turnIndex) {
            if (this.turnIndex == this.playerIDs.length) {
                this.turnIndex = 0;
            }
            if (this.playerIDs.length != 0) {
                this.players.get(this.playerIDs[this.turnIndex]).isTurn = true;
                this.clients.get(this.playerIDs[this.turnIndex]).emit('notify-host');
            }
        }
        
        console.log(`${username} has disconnected`);
    }
}

Game.prototype.getPlayers = function() {
    return this.players.values();
}

Game.prototype.nextPlayerTurn = function () {
    this.turnIndex = (this.turnIndex + 1) % this.playerIDs.length;
    this.players.get(this.playerIDs[this.turnIndex]).isTurn = true;
}

Game.prototype.raise = function(socketID, data) {
    var player =  this.players.get(socketID);
    // Verify it is the players turn
    var validRaise = data.amount > this.bidAmount;
    if (player.isTurn && validRaise) {
        console.log(`${player.name} has raised to ${data.amount} ${data.face}'s`);
        this.bidAmount = data.amount;
        this.bidFace = data.face;
        player.isTurn = false;
        this.nextPlayerTurn();
    }
}

Game.prototype.startGame = function(socketID) {
    if (this.players.get(socketID).isTurn && this.playerIDs.length > 1) {
        this.gameStarted = true;
        this.generateDiceRolls();
    }
}

Game.prototype.generateDiceRolls = function() {
    for (var i = 0; i < this.playerIDs.length; i++) {
        var player = this.players.get(this.playerIDs[i]);

        var diceRolls = [];
        for (var j=0; j < player.dice_amount; j++) {
            diceRolls.push(Math.floor(Math.random() * 6 + 1));
        }

        player.dice_rolls = diceRolls;
    }
}

module.exports = Game
