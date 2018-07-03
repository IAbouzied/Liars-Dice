var socket = io();
var username_field = document.getElementById("username");

function connectPlayer() {
    console.log("Button clicked");
    if (username_field.value != "") {
        socket.emit('connect-player', username_field.value);
        console.log("Emitted message");
    }
}