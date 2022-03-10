const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server)

const users = {}

app.use(express.static("public"))

app.get('/', ((req, res, next) => {
    res.sendFile(__dirname + "/public/index.html");
}));

app.get('/users', ((req, res, next) => {
    res.send(Object.values(users))
}));

io.on('connection', (socket) => {
    console.log(socket.id);
    socket.on('user-connected', user => {
        users[socket.id] = {...user, id: socket.id}
        socket.broadcast.emit('users-changed', Object.values(users))
    })

    socket.on('disconnect', () => {
        delete users[socket.id]
        socket.broadcast.emit('users-changed', Object.values(users))
    })

    socket.on('new-chat-message', message => {
        socket.to(message.recipientId).emit('new-chat-message', {
            text: message.text,
            senderId: socket.id
        })
    })
})

server.listen(3000, () => {
    console.log("3000")
})