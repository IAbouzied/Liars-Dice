// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var Game = require('./lib/Game');

var app = express();
var server = http.Server(app);
var io = socketIO(server);
var port = process.env.PORT || 8080;
var game = new Game();

app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
server.listen(port, '192.168.0.7', () => {
    console.log(`Server running on port ${port}`);
});

io.on('connection', (socket) => {
    // Send player list initally
    socket.emit("updated-state", {
        players: game.getPlayers(),
        bidAmount: game.bidAmount,
        bidFace: game.bidFace,
        bidPlayer: game.biddingPlayerID,
        message: game.gameMessage,
        active: game.roundActive,
        gameStarted: game.gameStarted
    });

    socket.on('connect-player', (data) => {
        game.addPlayer(socket, data);
        sendUpdatedState();
    });

    socket.on('disconnect', () => {
        game.removePlayer(socket);
        sendUpdatedState();
    });

    socket.on('request-game-start', () => {
        game.startGame(socket.id);
        if (game.gameStarted) {
            io.sockets.emit('start-game');
            sendUpdatedState();
        }
    });

    socket.on('raise', (data) => {
        game.raise(socket.id, data);
        sendUpdatedState();
    });

    socket.on('lie', () => {
        game.evaluateLie(socket.id);
        sendUpdatedState();
    });

    socket.on('request-next-round', () => {
        game.startNextRound(socket.id);
        sendUpdatedState();
    });

    socket.on('chat-message-send', (message) => {
        var player = game.players.get(socket.id);
        if (player != null) {
            var sender_name = player.name;
            console.log(`${sender_name}: ${message}`);
            io.sockets.emit('chat-message-receive', {
                sender: sender_name,
                message: message
            });
        }
    });
});

function sendUpdatedState() {
    io.sockets.emit("updated-state", {
        players: game.getPlayers(),
        bidAmount: game.bidAmount,
        bidFace: game.bidFace,
        bidPlayer: game.biddingPlayerID,
        message: game.gameMessage,
        active: game.roundActive,
        gameStarted: game.gameStarted
    });
}