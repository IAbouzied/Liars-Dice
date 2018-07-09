var Player = require('./Player');
var HashMap = require('hashmap');

function Game() {
    this.players = new HashMap();
    this.clients = new HashMap();
    this.playerIDs = [];
    this.turnIndex = 0;
    this.gameStarted = false;

    this.biddingPlayerID = null;
    this.bidAmount = 0;
    this.bidFace = 0;
    this.gameMessage = null;
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

Game.prototype.nextPlayerTurn = function() {
    this.players.get(this.playerIDs[this.turnIndex]).isTurn = false;
    this.turnIndex = (this.turnIndex + 1) % this.playerIDs.length;
    if (this.players.get(this.playerIDs[this.turnIndex]).dice_amount == 0) this.nextPlayerTurn();
    else this.players.get(this.playerIDs[this.turnIndex]).isTurn = true;
}

Game.prototype.setTurn = function(playerID) {
    this.players.get(this.playerIDs[this.turnIndex]).isTurn = false;
    this.players.get(playerID).isTurn = true;
    this.turnIndex = this.playerIDs.indexOf(playerID);
}

Game.prototype.raise = function(socketID, data) {
    var player =  this.players.get(socketID);
    // Verify it is the players turn
    var validRaise = data.amount > this.bidAmount;
    if (player.isTurn && validRaise) {
        this.gameMessage = `${player.name} holds the bid at ${data.amount} ${data.face}'s`
        this.bidAmount = data.amount;
        this.bidFace = data.face;
        this.biddingPlayerID = player.socketID;
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

Game.prototype.evaluateLie = function(challengerID) {
    if (this.bidAmount != 0 && challengerID != this.biddingPlayerID && this.players.get(challengerID).dice_amount != 0) {
        var loserID = this.countDice(this.bidFace, this.bidAmount) ? challengerID : this.biddingPlayerID;
        var player = this.players.get(loserID); 
        player.dice_amount--;
        if (!(player.socketID == challengerID && player.dice_amount <= 0)) {
            this.setTurn(challengerID);
        }
        this.generateDiceRolls();

        this.biddingPlayerID = null;
        this.bidAmount = 0;
        this.bidFace = 0;
        this.gameMessage = `${player.name} has lost a dice, and now has ${player.dice_amount} dice`;
    }
}

Game.prototype.countDice = function(face, amount) {
    var total = 0;
    for (var i=0; i < this.playerIDs.length; i++) {
        var player = this.players.get(this.playerIDs[i]);
        for (var j=0; j < player.dice_rolls.length; j++) {
            if (player.dice_rolls[j] == face) total++;
        }
    }

    console.log(`There are ${total} ${face}'s`);
    return total >= amount;
}

module.exports = Game
