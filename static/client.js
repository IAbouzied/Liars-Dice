var socket = io();

var username_field = document.getElementById("username-field");
var player_list = document.getElementById("player-list");
var raise_button = document.getElementById("raise-button");
var call_lie_button = document.getElementById("call-lie-button");
var username_div = document.getElementById("username-div");
var turn_action_div = document.getElementById("turn-action-div");
var bid_amount = document.getElementById("bid-amount");
var bid_face = document.getElementById("bid-face");

socket.on("updated-state", (data) => {
    updatePlayerList(data.players);
    bid_amount.min = data.bidAmount;
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
        
        // Listing the element
        var list_elem = document.createElement("li");
        list_elem.textContent = players[i].name;
        if (players[i].isTurn) list_elem.style.fontWeight = 'bold';
        player_list.appendChild(list_elem);

        if (players[i].socketID == socket.id) {
            raise_button.disabled = !players[i].isTurn;
            list_elem.textContent += " " + players[i].dice_rolls.toString();
        }
        else if (players[i].dice_rolls.length != 0) {
            list_elem.textContent += " " + "X ".repeat(players[i].dice_amount);
        }
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
    if (bid_amount.value != 0) {
        socket.emit('raise', {
            amount: bid_amount.value,
            face: bid_face.value
        });
    }
}

function lie() {
    socket.emit('lie');
}