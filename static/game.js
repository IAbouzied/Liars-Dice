var socket = io();

socket.on('message', (data) => {
    console.log(`Received a message: ${data}`);
});