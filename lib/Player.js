function Player(socket) {
    this.socket = socket;
    this.dice_amount = 5;
    this.dice_rolls = [];
}

module.exports = Player
