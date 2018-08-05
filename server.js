// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var HashMap = require('hashmap');
var Game = require('./lib/Game');

var app = express();
var server = http.Server(app);
var io = socketIO(server);
var port = process.env.PORT || 8080;
var games = new HashMap();

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
    
    socket.on('join-room-request', (roomName) => {
        var game = games.get(roomName);
        if (Object.keys(socket.rooms).length > 1) {
            socket.emit("room-message", "You are already in a room");
        }
        else if (game != null) {
            socket.join(roomName);
            // Send player list initally
            socket.emit("updated-state", {
                players: game.getPlayers(),
                bidAmount: game.bidAmount,
                bidFace: game.bidFace,
                bidPlayer: game.biddingPlayerID,
                messages: game.gameMessages,
                active: game.roundActive,
                gameStarted: game.gameStarted
            });
            socket.emit("room-message", "");
            socket.emit("room-joined");
        }
        else {
            socket.emit("room-message", `The room ${roomName} does not exist`);
        }
    });

    socket.on('create-room-request', (roomName) => {
        if (Object.keys(socket.rooms).length > 1) {
            socket.emit("room-message", "You are already in a room");
        }
        else if (games.get(roomName) == null) {
            games.set(roomName, new Game());
            socket.join(roomName);
            socket.emit("room-message", "");
            socket.emit("room-joined");
        }
        else {
            socket.emit("room-message", `The room ${roomName} already exists`);
        }
    });

    socket.on('connect-player', (data) => {
        var game = getSocketGame(socket);
        if (game != null) {
            game.addPlayer(socket, data);
            updateStateAllPlayers(Object.keys(socket.rooms)[1]);
        }
    });

    socket.on('disconnecting', () => {
        var game = getSocketGame(socket);
        if (game != null) {
            game.removePlayer(socket);
            if (game.isEmpty()) {
                games.delete(Object.keys(socket.rooms)[1]);
            }
            else {
                updateStateAllPlayers(Object.keys(socket.rooms)[1]);
            }
        }
    });

    socket.on('disconnect', () => {
    });

    socket.on('request-game-start', () => {
        var game = getSocketGame(socket);
        if (game != null) {
            game.startGame(socket.id);
            if (game.gameStarted) {
                io.sockets.emit('start-game');
                updateStateAllPlayers(Object.keys(socket.rooms)[1]);
            }
        }
    });

    socket.on('raise', (data) => {
        var game = getSocketGame(socket);
        if (game != null) {
            game.raise(socket.id, data);
            updateStateAllPlayers(Object.keys(socket.rooms)[1]);
        }
    });

    socket.on('lie', () => {
        var game = getSocketGame(socket);
        if (game != null) {
            game.evaluateLie(socket.id);
            updateStateAllPlayers(Object.keys(socket.rooms)[1]);
        }
    });

    socket.on('request-next-round', () => {
        var game = getSocketGame(socket);
        if (game != null) {
            game.startNextRound(socket.id);
            updateStateAllPlayers(Object.keys(socket.rooms)[1]);
        }
    });

    socket.on('chat-message-send', (message) => {
        var game = getSocketGame(socket);
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

function getSocketGame(socket) {
    var roomName = Object.keys(socket.rooms)[1];
    if (roomName != null) {
        return games.get(roomName);
    }
    return null;
}

function updateStateAllPlayers(room) {
    var game = games.get(room);
    if (game != null) {
        io.to(room).emit("updated-state", {
            players: game.getPlayers(),
            bidAmount: game.bidAmount,
            bidFace: game.bidFace,
            bidPlayer: game.biddingPlayerID,
            messages: game.gameMessages,
            active: game.roundActive,
            gameStarted: game.gameStarted
        });
        game.gameMessages.length = 0;
    }
}