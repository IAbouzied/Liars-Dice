var socket = io();

var username_field = document.getElementById("username");
var player_list = document.getElementById("player-list");
var raise_button = document.getElementById("raise-button");
var call_lie_button = document.getElementById("call-lie-button");

socket.on("update-player-list", (data) => {
    updatePlayerList(data.players);
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
    }
}

function raise() {
    console.log("Sending raise");
    socket.emit('raise');
}