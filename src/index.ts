import { Socket,Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import { createServer } from "http";


dotenv.config();

const app = express();
const isDev = app.settings.env === "development";
const URL = isDev ? "http://localhost:3000" : process.env.FRONTEND_URL;
app.use(
  cors({
    origin: URL,
  })
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: URL,
  },
});

io.on("connection", (socket: Socket) => {
  // for broadcasting the text in room
  socket.on(
    "getText",
    ({ userText, roomID }: { userText: string; roomID: string }) => {
      socket.to(roomID).emit("newText", userText);
    }
  );

  // creating the room
  socket.on("createRoom", () => {
    const roomId = uuidv4().split("").splice(0, 6).join("");
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  // joining the room
  socket.on("joinRoom", (roomId: string) => {
    const rooms = Object.keys(socket.rooms);
    if (rooms.includes(roomId)) {
      socket.join(roomId);
      socket.emit("joinedRoom", roomId);
    } else {
      socket.emit("invalidRoom", "Invalid room id");
    }
  });

  // check valid room
  socket.on("checkValidRoom", (roomId: string) => {
    const rooms = Object.keys(socket.rooms);
    const doesExist = rooms.includes(roomId);
    if (doesExist === false) {
      socket.emit("invalidRoom", "Invalid room id");
    }
  });

  // leave the room
  socket.on("leaveRoom", (roomID: string) => {
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

httpServer.listen(process.env.PORT ?? 5000);
