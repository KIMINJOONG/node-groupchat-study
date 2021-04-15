const express = require('express');
const http = require('http');
const app = express();
const path = require("path");
const server = http.createServer(app);
const socketIo = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'src')));

const botName = "ChatCord Bot";

io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage(botName, '환영합니다.'));

        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} 님이 ${room}방에 입장하셨습니다`));

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} 님이 채팅방을 나갔습니다.`));
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT=5000;

server.listen(PORT, () => {
    console.log(`server is running ${PORT}`);
});