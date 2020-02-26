const socket = io("http://localhost:3000");
const messageContainer = document.getElementById('message-container');
const roomContainer = document.getElementById('room-container');
const userContainer = document.getElementById("user-container");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");

socket.on("room-created", room => {
    const roomElement = document.createElement("div");
    roomElement.innerText = room;
    const roomLink = document.createElement("a");
    roomLink.href = `/${room}`;
    roomLink.innerText = "Join Room";
    roomContainer.append(roomElement);
    roomContainer.append(roomLink);
});

if (messageForm != null) {
    const username = prompt("What is your name?");
    appendUsers(username);
    appendMessage(username + ' You join');
    socket.emit("new-user", roomName, username);

    messageForm.addEventListener("submit", e => {
        e.preventDefault();
        const message = messageInput.value;
        appendUsers(username);
        // appendMessage(`${username}: ${message}`);
        appendMessage(`${username} You: ${message}`);
        socket.emit("send-chat-message", roomName, message);
        messageInput.value = "";
    });

    socket.on("chat-message", data => {
        appendMessage(`${data.username}: ${data.message}`);
    });

    socket.on("user-connected", username => {
        appendUsers(username);
        appendMessage(`${username} connected.`);
    });

    socket.on("user-disconnected", username => {
        appendMessage(`${username} disconnected.`);
    });

    function appendMessage(message) {
        const messageElement = document.createElement("div");
        messageElement.innerText = message;
        messageContainer.append(messageElement);
    }

    function appendUsers(user) {
        const userElement = document.createElement("div");
        userElement.innerText = user;
        userContainer.append(userElement);
    }
}