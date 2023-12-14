const express = require("express");
const { Socket } = require("socket.io");
const path = require("path");
var cookieParser = require("cookie-parser");
const { redisConnection, redisStoreKeys } = require("./src/util/redis");
const { bootKafka, sendMessage } = require("./src/util/kafka");

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3030;
const http = require("http").Server(app);

// attach socket io
const io = require("socket.io")(http);

// create connection
io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;
  const socketId = socket.id;
  redisConnection.sadd("user:" + userId + ":sockets", socket.id);

  socket.on("disconnect", (socket) => {
    console.log("disconnecting " + userId);
    redisConnection.srem("user:" + userId + ":sockets", socketId);
  });
});

app.get("/active-users", async (req, res) => {
  const activeUsers = await redisConnection.smembers(
    redisStoreKeys.activeUsers
  );
  res.json(activeUsers);
});

app.get("/", async (req, res) => {
  // not logged in
  if (!req.cookies.userId) res.redirect("/login");

  const activeUser = await redisConnection.sismember(
    redisStoreKeys.activeUsers,
    req.cookies.userId
  );
  // session expired
  if (activeUser !== 1) {
    res.clearCookie("userId");
    res.redirect("/login");
  }

  res.sendFile(path.join(__dirname, "src/static/index.html"));
});

app.get("/static/js/chatApp.js", (req, res) => {
  res.sendFile(path.join(__dirname, "src/static/js/chatApp.js"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "src/static/login.html"));
});

app.post("/login", async (req, res) => {
  userId = req.body.username;
  res.cookie("userId", userId);
  await redisConnection.sadd("active_users", userId);
  res.redirect("/");
});

app.post("/message", async (req, res) => {
  // not logged in
  const from = req.cookies.userId;
  const content = req.body.messageBody;
  const conversationId = req.body.conversationId;

  const message = {
    conversationId,
    from,
    content,
  };
  sendMessage(message);
  res.json("OK");
});

bootKafka(io).catch(console.error);

http.listen(port, () => {
  console.log("listening on port" + port);
});
