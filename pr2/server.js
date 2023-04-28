// required files
/*
The required modules are imported at the beginning of the code: 
path for handling file paths, 
express for creating the web server, http for creating an HTTP server, 
moment for handling timestamps, and socket.io for 
enabling real-time communication between clients and the server.

*/
path = require("path");
const express = require("express");
const http = require("http");
const moment = require("moment");
const socketio = require("socket.io");
const PORT = process.env.PORT || 3000;
const ip = require("ip");
const app = express(); // express app created
const server = http.createServer(app); // http server created
const io = socketio(server); // socket.io instance created

//static files are served
app.use(express.static(path.join(__dirname, "public")));

let rooms = {};
let socketroom = {};
let socketname = {};
let micSocket = {};
let videoSocket = {};
let roomBoard = {};


// event hadler -> on establising a connection between client and server
io.on("connect", (socket) => {

  // event listeners
  socket.on("join room", (roomid, username) => {
    socket.join(roomid); // client is joined to the roomid

    // maps the socket.id of the client to various info
    socketroom[socket.id] = roomid; //
    socketname[socket.id] = username;
    micSocket[socket.id] = "on";
    videoSocket[socket.id] = "on";

    // checks if there are clients already
    if (rooms[roomid] && rooms[roomid].length > 0) {

      // pushes the socket id to the array containing other clients
      rooms[roomid].push(socket.id);
      // event emitter: to all other clients
      socket
        .to(roomid)
        .emit(
          "message",
          `${username} joined the room.`,
          "Bot", // send from a bot
          moment().format("h:mm a") // with timestamp
        );
        // join room event emitter : gives status of other users, their mics and video, username
      io.to(socket.id).emit(
        "join room",
        rooms[roomid].filter((pid) => pid != socket.id),
        socketname,
        micSocket,
        videoSocket
      );
    } else { // if no clients are there already
      rooms[roomid] = [socket.id];
      io.to(socket.id).emit("join room", null, null, null, null);
    }

    // event emitter : giving user count to other users

    io.to(roomid).emit("user count", rooms[roomid].length);
  });

  // event listners
  socket.on("action", (msg) => {
    if (msg == "mute") micSocket[socket.id] = "off";
    else if (msg == "unmute") micSocket[socket.id] = "on";
    else if (msg == "videoon") videoSocket[socket.id] = "on";
    else if (msg == "videooff") videoSocket[socket.id] = "off";

    // event to all other clients
    socket.to(socketroom[socket.id]).emit("action", msg, socket.id);
  });

  // only to a specified client 

  socket.on("video-offer", (offer, sid) => {
    socket
      .to(sid)
      .emit(
        "video-offer",
        offer,
        socket.id,
        socketname[socket.id],
        micSocket[socket.id],
        videoSocket[socket.id]
      );
  });

  // other event listners
  socket.on("video-answer", (answer, sid) => {
    socket.to(sid).emit("video-answer", answer, socket.id);
  });

  socket.on("new icecandidate", (candidate, sid) => {
    socket.to(sid).emit("new icecandidate", candidate, socket.id);
  });

  socket.on("message", (msg, username, roomid) => {
    io.to(roomid).emit("message", msg, username, moment().format("h:mm a"));
  });

  socket.on("getCanvas", () => {
    if (roomBoard[socketroom[socket.id]])
      socket.emit("getCanvas", roomBoard[socketroom[socket.id]]);
  });

  socket.on("draw", (newx, newy, prevx, prevy, color, size) => {
    socket
      .to(socketroom[socket.id])
      .emit("draw", newx, newy, prevx, prevy, color, size);
  });

  socket.on("clearBoard", () => {
    socket.to(socketroom[socket.id]).emit("clearBoard");
  });

  socket.on("store canvas", (url) => {
    roomBoard[socketroom[socket.id]] = url;
  });

  socket.on("disconnect", () => {
    if (!socketroom[socket.id]) return;
    socket
      .to(socketroom[socket.id])
      .emit(
        "message",
        `${socketname[socket.id]} left the chat.`,
        `Bot`,
        moment().format("h:mm a")
      );
    socket.to(socketroom[socket.id]).emit("remove peer", socket.id);
    var index = rooms[socketroom[socket.id]].indexOf(socket.id);
    rooms[socketroom[socket.id]].splice(index, 1);
    io.to(socketroom[socket.id]).emit(
      "user count",
      rooms[socketroom[socket.id]].length
    );
    delete socketroom[socket.id];
    console.log("--------------------");
    console.log(rooms[socketroom[socket.id]]);

    
  });
});

server.listen(PORT, () =>
  console.log(`Server is up and running on port ${PORT}`)
);
