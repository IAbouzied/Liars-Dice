var socket = io();

var username_field = document.getElementById("username-field");
var player_list = document.getElementById("player-list");
var raise_button = document.getElementById("raise-button");
var call_lie_button = document.getElementById("call-lie-button");
var username_div = document.getElementById("username-div");
var turn_action_div = document.getElementById("turn-action-div");

socket.on("update-player-list", (data) => {
    updatePlayerList(data.players);
});

socket.on('notify-host', () => {
    becomeHost();
});

socket.on('start-game', () => {
    gameStarted();
});

function updatePlayerList(players) {
    player_list.innerHTML = "";
    for (var i=0; i < players.length; i++) {
        // Raise button
        if (players[i].socketID == socket.id) raise_button.disabled = !players[i].isTurn;

        // Listing the element
        var list_elem = document.createElement("li");
        list_elem.textContent = players[i].name;
        if (players[i].isTurn) list_elem.style.fontWeight = 'bold';
        player_list.appendChild(list_elem);
    }
}

function connectPlayer() {
    if (username_field.value != "") {
        socket.emit('connect-player', username_field.value);
        
        // Putting in title
        username_div.innerHTML = "";
        var title = document.createElement('h2');
        title.textContent = "Welcome " + username_field.value;
        username_div.appendChild(title);
    }
}

function becomeHost() {
    var start_button = document.createElement('button');
    start_button.onclick = requestGameStart;
    start_button.textContent = "Begin game";
    username_div.appendChild(start_button);
}

function requestGameStart() {
    socket.emit('request-game-start');
}

function gameStarted() {
    turn_action_div.hidden = false;
}

function raise() {
    console.log("Sending raise");
    socket.emit('raise');
}