import express from "express";
import { Server } from "socket.io";
import { activeMarkers, addMarker } from "./models/marcadores.js";


const app = express();
const port = 4000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

const io = new Server(server, {
      cors: {
            // origin: 'http://127.0.0.1:5173'
            origin: 'https://track-your-people-front.vercel.app'
      }
});
io.set('origins', '*');

let onlyActiveMarkers

io.on("connection", (socket) => {
  console.log("a user connected");


  socket.on("new-marker", (markerPosition) => {



    addMarker(markerPosition);



    console.log('array de marcadres activos--->', activeMarkers);


    onlyActiveMarkers = activeMarkers.filter(item => item.markerId != '')



    socket.broadcast.emit("emit-new-marker", onlyActiveMarkers); // everyone gets it but the sender
  });


  socket.on("moving-marker", (movingMarker) => {

    console.log('movingMarker--->', movingMarker);
    socket.broadcast.emit('moving-marker', movingMarker);
    

  })



});
