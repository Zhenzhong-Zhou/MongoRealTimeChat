if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require("express");
const app = express();
const expressLayouts = require("express-ejs-layouts");

const server = require("http").createServer(app);
const io = require("socket.io")(server);

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", error => console.error(error));
db.once("open", () => console.log("Connected to Mongoose......"));

app.set("view engine",  "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use("/public", express.static("public"));
app.use(express.urlencoded({limit: "10mb", extended: false}));
app.use(express.json());

const Message = require("./models/message");
const rooms = {};

app.get("/", async (req, res) => {
    res.render("index", {
        rooms: rooms
    })
});

app.post("/room", (req, res) => {
    if (rooms[req.body.room] != null) {
        return res.redirect("/");
    }
    rooms[req.body.room] = {users: {}};
    res.redirect(req.body.room);
    io.emit("room-created", req.body.room);
});

app.get("/:room", async (req, res) => {
    // if (rooms[req.body.room] == null) {
    //     return res.redirect("/");
    // }
    const messages = await Message.find({}).limit(10).sort({createdAt: -1}).exec();
    res.render("rooms", {
        rooms: rooms,
        roomName: req.params.room,
        messages: messages
    })
});

let messages = [];
// let users = {};

Message.find((err, result) => {
    if (err) throw err;
    // users = result;
    messages = result;
});

io.on("connection", socket => {
    socket.on("new-user", async (room, username) => {
        socket.join(room);
        rooms[room].users[socket.id] = username ;
        socket.to(room).broadcast.emit("user-connected", username);
        console.log("Connected: %s sockets connected", username);
    });
    // socket.emit("chat-message", "new connection made. " + socket.id);
    socket.on("send-chat-message", async (room, message) => {
        let newMessage = new Message({
            username: rooms[room].users[socket.id],
            message: message
        });
        try {
            await newMessage.save();
            socket.to(room).broadcast.emit("chat-message", {
                username: rooms[room].users[socket.id],
                message: message
            });
        }catch (e) {
            console.log(e);
        }
    });
    socket.on("disconnect", () => {
        getUserRooms(socket).forEach(room => {
            socket.broadcast.emit("user-disconnected", rooms[room].users[socket.id]);
            delete rooms[room].users[socket.id];
        });
    });
});

function getUserRooms(socket) {
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if (room.users[socket.id] != null) names.push(name);
        return names;
    }, []);
}

server.listen(3000, () => console.log("Server is running...."));