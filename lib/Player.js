function Player(socket, name, isTurn) {
    this.socketID = socket.id;
    this.dice_amount = 4;
    this.dice_rolls = [];
    this.name = name;
    this.isTurn = isTurn;
}

module.exports = Player
