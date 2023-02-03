
import express from "express";
import http from "http"; // modulo de node
import { Server as SocketServer } from "socket.io";
import { activeMarkers, addMarker } from "./models/marcadores.js";

const app = express();
const server = http.Server(app);

const io = new SocketServer(server, {
  cors: {
    //origin: "https://track-your-people-front.vercel.app",
    origin: "*",
    
  },
});

const port = 4000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

let onlyActiveMarkers;

io.on("connection", (socket) => {
  console.log("a user connected");
  console.log("socket", socket.id);
  socket.on("new-marker", (markerPosition) => {
    addMarker(markerPosition);
    console.log("array de marcadres activos--->", activeMarkers);
    onlyActiveMarkers = activeMarkers.filter((item) => item.markerId != "");
    socket.broadcast.emit("emit-new-marker", onlyActiveMarkers); // everyone gets it but the sender
  });

  socket.on("moving-marker", (movingMarker) => {
    console.log("movingMarker--->", movingMarker);
    socket.broadcast.emit("moving-marker", movingMarker);
  });
});

server.listen(port, () => console.log(`Example app listening on port ${port}`));
