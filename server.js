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
server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});

io.on('connection', (socket) => {
    // Send player list initally
    socket.emit("update-player-list", {
        players: game.getPlayers()
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

    socket.on('raise', () => {
        game.raise(socket.id);
        sendUpdatedState();
    });
});

function sendUpdatedState() {
    io.sockets.emit("update-player-list", {
        players: game.getPlayers()
    });
}