var Player = require('./Player');
var HashMap = require('hashmap');

function Game() {
    this.players = new HashMap();
    this.clients = new HashMap();
    this.playerIDs = [];
    this.startingDiceNumber = 4;
    this.turnIndex = 0;
    this.gameStarted = false;
    this.roundActive = false;

    this.biddingPlayerID = null;
    this.bidAmount = 0;
    this.bidFace = 0;
    this.gameMessages = [];
}

Game.prototype.addPlayer = function(socket, name) {
    this.gameMessages.push(`${name} has connected`);
    var isTurn = (this.players.size == 0) ? true : false;
    if (isTurn) socket.emit('notify-host');
    this.players.set(socket.id, new Player(socket, name, isTurn));
    if (this.gameStarted) {
        this.players.get(socket.id).dice_amount = 0;
        this.gameMessages.push(`${name} joined after a game has begun, and will start with dice the in next game`);
    }
    this.clients.set(socket.id, socket);
    this.playerIDs = this.players.values().map((player) => {return player.socketID});
    console.log(`${name} has connected`);
}

Game.prototype.removePlayer = function(socket) {
    if (this.players.has(socket.id)) {
        var player = this.players.get(socket.id);
        var username = player.name;
        if (this.gameStarted) {
            player.dice_amount = 0;
            player.dice_rolls.length = 0;
            var potential_winner = this.checkWinner();
            if (potential_winner != null) {
                this.endGame(potential_winner);
            }
            var deleted_player_index = this.playerIDs.indexOf(socket.id);
            if (deleted_player_index == this.turnIndex) { 
                this.nextPlayerTurn();
            }
            else if (deleted_player_index < this.turnIndex) {
                this.turnIndex--;
            }
            this.players.delete(socket.id);
            this.clients.delete(socket.id);
            this.playerIDs = this.players.values().map((player) => {return player.socketID});
        }
        else {
            this.players.delete(socket.id);
            this.clients.delete(socket.id);
            this.playerIDs = this.players.values().map((player) => {return player.socketID});

            if (this.playerIDs.length != 0) {
                this.players.get(this.playerIDs[0]).isTurn = true;
                this.clients.get(this.playerIDs[0]).emit('notify-host');
            }
        }
        
        
        if (this.playerIDs.length == 0) this.gameStarted = false;
        this.gameMessages.push(`${username} has disconnected`);
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
    else {
        var socketID = this.playerIDs[this.turnIndex];
        this.players.get(socketID).isTurn = true;
        this.clients.get(socketID).emit('notify-turn');
    }
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
    if (player.isTurn && validRaise && this.roundActive) {
        this.gameMessages.push(`${player.name} holds the bid at ${data.amount} ${data.face}'s`);
        this.bidAmount = data.amount;
        this.bidFace = data.face;
        this.biddingPlayerID = player.socketID;
        this.nextPlayerTurn();
    }
}

Game.prototype.startGame = function(socketID) {
    if (this.players.get(socketID).isTurn && this.playerIDs.length > 1 && !this.gameStarted) {
        this.gameStarted = true;
        this.roundActive = true;
        this.generateDiceRolls();
    }
}

Game.prototype.generateDiceRolls = function() {
    for (var i = 0; i < this.playerIDs.length; i++) {
        var player = this.players.get(this.playerIDs[i]);

        var diceRolls = [];
        if (player.dice_amount > 0) {
            for (var j=0; j < player.dice_amount; j++) {
                diceRolls.push(Math.floor(Math.random() * 6 + 1));
            }
    
            this.clients.get(this.playerIDs[i]).emit('roll-dice');
        }
        player.dice_rolls = diceRolls;
    }
}

Game.prototype.evaluateLie = function(challengerID) {
    if (this.roundActive && this.bidAmount != 0 && challengerID != this.biddingPlayerID && this.players.get(challengerID).dice_amount != 0) {
        this.gameMessages.push(`${this.players.get(challengerID).name} challenges ${this.players.get(this.biddingPlayerID).name}'s bid`);
        this.roundActive = false;

        var bidCorrect = this.diceAtLeast(this.bidFace, this.bidAmount);
        var winnerID = bidCorrect ? this.biddingPlayerID : challengerID;
        var loserID =  bidCorrect ? challengerID : this.biddingPlayerID;
        
        var player = this.players.get(loserID); 
        player.dice_amount--;
        // If challenger lost and it was their turn
        if (player.isTurn && player.dice_amount <= 0 && player.socketID == challengerID) {
            this.nextPlayerTurn();
        }
        // If challener is not out of the game
        else if (!(player.socketID == challengerID && player.dice_amount <= 0)) {
            this.setTurn(challengerID);
        }

        this.clients.get(winnerID).emit('won-lie');
        this.clients.get(loserID).emit('lost-dice');

        this.biddingPlayerID = null;
        this.bidAmount = 0;
        this.bidFace = 0;
        this.gameMessages.push(`${player.name} has lost a dice, and now has ${player.dice_amount} dice`);

        var winnerID = this.checkWinner();
        if (winnerID != null) {
            this.endGame(winnerID);
        }
    }
}

Game.prototype.startNextRound = function(socketID) {
    if (this.players.get(socketID).isTurn && !this.roundActive && this.gameStarted) {
        this.generateDiceRolls();
        this.roundActive = true;
    }
}

Game.prototype.diceAtLeast = function(face, amount) {
    var total = 0;
    for (var i=0; i < this.playerIDs.length; i++) {
        var player = this.players.get(this.playerIDs[i]);
        for (var j=0; j < player.dice_rolls.length; j++) {
            if (player.dice_rolls[j] == face) total++;
        }
    }

    this.gameMessages.push(`There are ${total} ${face}'s`);
    return total >= amount;
}

Game.prototype.checkWinner = function() {
    var winnerID = null;
    var foundWinner = false;
    for (var i=0; i < this.playerIDs.length; i++) {
        if (this.players.get(this.playerIDs[i]).dice_amount > 0) {
            if (foundWinner) return null;
            else {
                winnerID = this.playerIDs[i];
                foundWinner = true;  
            } 
        }
    }

    return winnerID;
}

Game.prototype.endGame = function(winnerID) {
    var winner = this.players.get(winnerID);
    this.gameMessages.push(`${winner.name} has won the game!`);
    this.gameStarted = false;
    this.roundActive = false;
    this.players.get(this.playerIDs[this.turnIndex]).isTurn = false;
    this.players.get(winnerID).isTurn = true;
    this.resetDice();
    this.clients.get(winnerID).emit('notify-host');
}

Game.prototype.resetDice = function() {
    for (var i=0; i < this.playerIDs.length; i++) {
        this.players.get(this.playerIDs[i]).dice_amount = this.startingDiceNumber;
    }
}

Game.prototype.isEmpty = function() {
    return this.playerIDs.length == 0;
}
module.exports = Game
