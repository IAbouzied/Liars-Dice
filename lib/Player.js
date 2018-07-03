function Player(socket, name) {
    this.socket = socket;
    this.dice_amount = 5;
    this.dice_rolls = [];
    this.name = name;
}

module.exports = Player
