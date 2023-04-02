//const { setEngine } = require('crypto');
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');


app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
  res.render('index.ejs')
})
app.get('/new-room', (req, res) =>{
  res.redirect(`/new-room/${uuidV4()}`)
})
app.get('/new-room/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})
const users = {};

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, name) => {
    if (!users[roomId]) {
      users[roomId] = {};
    }
    users[roomId][userId] = { name };

    socket.join(roomId);
    io.to(roomId).emit("updateUserList", Object.values(users[roomId]));

    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      delete users[roomId][userId];
      io.to(roomId).emit("updateUserList", Object.values(users[roomId]));
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });

    socket.on("send-message", (message) => {
      const name = users[roomId][userId].name;
      io.to(roomId).emit("new-message", message, name);
    });    
  });
});
server.listen(3000)