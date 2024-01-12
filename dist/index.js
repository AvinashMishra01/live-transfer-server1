"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
dotenv_1.default.config();
const app = (0, express_1.default)();
const isDev = app.settings.env === "development";
const URL = isDev ? "http://localhost:3000" : process.env.FRONTEND_URL;
app.use((0, cors_1.default)({
    origin: URL,
}));
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: URL,
    },
});
io.on("connection", (socket) => {
    // for broadcasting the text in room
    socket.on("getText", ({ userText, roomID }) => {
        socket.to(roomID).emit("newText", userText);
    });
    // creating the room
    socket.on("createRoom", () => {
        const roomId = (0, uuid_1.v4)().split("").splice(0, 6).join("");
        socket.join(roomId);
        socket.emit("roomCreated", roomId);
    });
    // joining the room
    socket.on("joinRoom", (roomId) => {
        const rooms = Object.keys(socket.rooms);
        if (rooms.includes(roomId)) {
            socket.join(roomId);
            socket.emit("joinedRoom", roomId);
        }
        else {
            socket.emit("invalidRoom", "Invalid room id");
        }
    });
    // check valid room
    socket.on("checkValidRoom", (roomId) => {
        const rooms = Object.keys(socket.rooms);
        const doesExist = rooms.includes(roomId);
        if (doesExist === false) {
            socket.emit("invalidRoom", "Invalid room id");
        }
    });
    // leave the room
    socket.on("leaveRoom", (roomID) => {
        socket.leave(roomID);
        socket.emit("roomLeft", {
            success: true,
            message: "Room left successfully",
        });
    });
    // for disconnection
    socket.on("disconnect", () => {
        const rooms = Object.keys(socket.rooms);
        rooms.forEach((room) => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });
    });
});
httpServer.listen((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 5000);
