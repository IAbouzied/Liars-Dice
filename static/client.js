var socket = io();

var room_name_field = document.getElementById("room-name");
var create_room_button = document.getElementById("create-room");
var join_room_button = document.getElementById("join-room");
var room_helper_text = document.getElementById("room-helper-text");
var room_div = document.getElementById("room-div");

var game_div = document.getElementById("game-div");

var username_field = document.getElementById("username-field");
var username_div = document.getElementById("username-div");
var player_list = document.getElementById("player-list");

var turn_action_div = document.getElementById("turn-action-div");
var raise_bid_div = document.getElementById("place_bid");
var raise_button = document.getElementById("raise-button");
var call_lie_button = document.getElementById("call-lie-button");
var bid_amount = document.getElementById("bid-amount");
var bid_face = document.getElementById("bid-face");
var turn_helper_text = document.getElementById("turn-helper-text");

var recent_action = document.getElementById("recent-action");
var begin_game_button = document.getElementById("begin-game");
var request_round_button = document.getElementById("begin-next-round");
var event_list = document.getElementById("event-list");

var chat_list = document.getElementById("chat-list");
var chat_message_field = document.getElementById("chat-message");
var chat_button = document.getElementById("send-chat-button");

socket.on("updated-state", (data) => {
    bid_amount.min = String(Number(data.bidAmount) + 1);
    addEvents(data.messages);
    updatePlayerList(data.players, data.active, data.gameStarted);
    buttonVisibilities(data.gameStarted, isTurn(data.players), data.bidAmount != 0, data.bidPlayer, data.active);
});

socket.on('notify-host', () => {
    becomeHost();
});

socket.on('start-game', () => {
    gameStarted();
});

socket.on('room-joined', () => {
    room_div.hidden = true;
    game_div.hidden = false;
});

socket.on('room-message', (message) => {
    room_helper_text.textContent = message;
});

socket.on('chat-message-receive', (data) => {
    updateChat(data.sender, data.message);
});

function createRoom() {
    if (room_name_field.value != "") {
        socket.emit("create-room-request", room_name_field.value);
    }
    else {
        room_helper_text.textContent = "Please enter a room name";
    }
}

function joinRoom() {
    if (room_name_field.value != "") {
        socket.emit("join-room-request", room_name_field.value);
    }
    else {
        room_helper_text.textContent = "Please enter a room name";
    }
}

function updatePlayerList(players, active, gameStarted) {
    player_list.innerHTML = "";
    for (var i=0; i < players.length; i++) {
        // Listing the element
        var list_elem = document.createElement("li");
        list_elem.textContent = players[i].name;
        if (players[i].isTurn) list_elem.classList += 'current-turn';
        player_list.appendChild(list_elem);

        if (players[i].socketID == socket.id) {
            if (players[i].dice_rolls.length != 0) {
                list_elem.textContent += " " + players[i].dice_rolls.join(' ');
            }
            else {
                if (gameStarted) list_elem.textContent += " is out of dice!";
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
    begin_game_button.hidden = false;
    turn_action_div.hidden = false;
}

function requestGameStart() {
    socket.emit('request-game-start');
}

function gameStarted() {
    turn_action_div.hidden = false;
}

function raise() {
    if (bid_amount.value != 0) {
        if (bid_amount.value < bid_amount.min) {
            turn_helper_text.textContent = `Your bid must be at least ${bid_amount.min}`;
        }
        else {
            turn_helper_text.textContent = "";
        }
        socket.emit('raise', {
            amount: bid_amount.value,
            face: bid_face.value
        });
    }
}

function addEvents(events) {
    if (events != null && events.length > 0) {
        for (var i=0; i < events.length; i++) {
            var list_elem = document.createElement("li");
            list_elem.textContent = events[i];
            event_list.appendChild(list_elem);
            if (i == events.length-1) {
                recent_action.textContent = events[i];
            }
        }
        event_list.scrollTop = event_list.scrollHeight;
    }
}

function lie() {
    turn_helper_text.textContent = "";
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

function isTurn(players) {
    for (var i=0; i < players.length; i++) {
        if (players[i].socketID == socket.id) return players[i].isTurn; 
    }
    return false;
}

function buttonVisibilities(gameStarted, myTurn, bidOccured, biddingPlayer, active) {
    if (gameStarted) {
        begin_game_button.hidden = true;
        raise_bid_div.hidden = !myTurn || !active;
        call_lie_button.hidden = !bidOccured || (biddingPlayer == socket.id);
        request_round_button.hidden = active || !myTurn;
    }
    else {
        if (myTurn) {
            begin_game_button.hidden = false;
        }
        raise_bid_div.hidden = true;
        call_lie_button.hidden = true;
        request_round_button.hidden = true;
    }
}

chat_message_field.addEventListener("keypress", (event) => {
    if (event.key == "Enter") {
        sendChatMessage();
    }
});
