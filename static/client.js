var socket = io();
var username_field = document.getElementById("username");
var player_list = document.getElementById("player-list");

socket.on("update-player-list", (data) => {
    updatePlayerList(data.playerNames);
});

function updatePlayerList(playerNames) {
    player_list.innerHTML = "";
    for (var i=0; i < playerNames.length; i++) {
        var list_elem = document.createElement("li");
        list_elem.textContent = playerNames[i];
        player_list.appendChild(list_elem);
    }
}

function connectPlayer() {
    if (username_field.value != "") {
        socket.emit('connect-player', username_field.value);
    }
}