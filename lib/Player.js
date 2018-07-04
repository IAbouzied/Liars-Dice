function Player(socket, name, isTurn) {
    this.socketID = socket.id;
    this.dice_amount = 5;
    this.dice_rolls = [];
    this.name = name;
    this.isTurn = isTurn;
}

module.exports = Player
