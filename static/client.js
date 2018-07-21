var socket = io();

var username_field = document.getElementById("username-field");
var player_list = document.getElementById("player-list");
var raise_button = document.getElementById("raise-button");
var call_lie_button = document.getElementById("call-lie-button");
var username_div = document.getElementById("username-div");
var turn_action_div = document.getElementById("turn-action-div");
var bid_amount = document.getElementById("bid-amount");
var bid_face = document.getElementById("bid-face");
var recent_action = document.getElementById("recent-action");
var request_round_button = document.getElementById("begin-next-round");
var event_list = document.getElementById("event-list");
var chat_list = document.getElementById("chat-list");
var chat_message_field = document.getElementById("chat-message");
var chat_button = document.getElementById("send-chat-button");

socket.on("updated-state", (data) => {
    bid_amount.min = data.bidAmount;
    if (data.message != null) {
        recent_action.textContent = data.message;
        addEvent(data.message);
    }
    call_lie_button.disabled = (data.bidAmount == 0 || data.bidPlayer == socket.id);   
    updatePlayerList(data.players, data.active, data.gameStarted);
});

socket.on('notify-host', () => {
    becomeHost();
});

socket.on('start-game', () => {
    gameStarted();
});

socket.on('chat-message-receive', (data) => {
    updateChat(data.sender, data.message);
});

function updatePlayerList(players, active, gameStarted) {
    player_list.innerHTML = "";
    for (var i=0; i < players.length; i++) {
        // Listing the element
        var list_elem = document.createElement("li");
        list_elem.textContent = players[i].name;
        if (players[i].isTurn) list_elem.classList += 'current-turn';
        player_list.appendChild(list_elem);

        if (players[i].socketID == socket.id) {
            raise_button.disabled = !players[i].isTurn || !active;
            request_round_button.hidden = !players[i].isTurn || active;
            if (players[i].dice_rolls.length != 0) {
                list_elem.textContent += " " + players[i].dice_rolls.join(' ');
            }
            else {
                if (gameStarted) list_elem.textContent += " is out of dice!";
                call_lie_button.disabled = true;
            }
        }
        else if (players[i].dice_rolls.length != 0) {
            if (active) list_elem.textContent += " " + "X ".repeat(players[i].dice_amount);
            else list_elem.textContent += " " + players[i].dice_rolls.join(' ');
        }
        else if (gameStarted) {
            list_elem.textContent += " is out of dice!";
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
        chat_message_field.disabled = false;
        chat_button.disabled = false;
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

function addEvent(event) {
    var list_elem = document.createElement("li");
    list_elem.textContent = event;
    event_list.appendChild(list_elem);
    event_list.scrollTop = event_list.scrollHeight;
}

function lie() {
    socket.emit('lie');
}

function requestNextRound() {
    socket.emit('request-next-round');
}

function updateChat(sender, message) {
    var new_message = document.createElement('li');
    new_message.innerHTML = `<b>${sender}:</b> ${message}`;
    chat_list.appendChild(new_message);
    chat_list.scrollTop = chat_list.scrollHeight;
}

function sendChatMessage() {
    if (chat_message_field != "") {
        socket.emit("chat-message-send", chat_message_field.value);
        chat_message_field.value = "";
    }
}

chat_message_field.addEventListener("keypress", (event) => {
    if (event.key == "Enter") {
        sendChatMessage();
    }
});
