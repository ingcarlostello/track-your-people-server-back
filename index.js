import cluster from "cluster";
import express from "express";
import http from "http"; // modulo de node
import { Server as SocketServer } from "socket.io";
import { activeMarkers, addMarker } from "./models/marcadores.js";

import { cpus } from "os";
import { setupMaster, setupWorker } from "@socket.io/sticky";
import { createAdapter, setupPrimary } from "@socket.io/cluster-adapter";

const numCPUs = cpus().length;

const port = 4000;
const app = express();


if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);
  const server = http.Server(app);

  // setup sticky sessions
  setupMaster(server, {
    loadBalancingMethod: "least-connection",
  });

  // setup connections between the workers
  setupPrimary();

  cluster.setupMaster({
    serialization: "advanced",
  });

  server.listen(port, () => console.log(`Example app listening on port ${port}`));

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
}else {

  console.log(`Worker ${process.pid} started`);

  const server = http.Server(app);

  const io = new SocketServer(server);

  // use the cluster adapter
  io.adapter(createAdapter());

  // setup connection with the primary process
  setupWorker(io);

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


}

// const app = express();
//const server = http.Server(app);

// const io = new SocketServer(server, {
//   cors: {
//     //origin: "https://track-your-people-front.vercel.app",
//     origin: "*",
//     credentials: true,
//     methods: ["GET", "POST"],
//   },
// });

//const port = 4000;

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });

// let onlyActiveMarkers;

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   console.log("socket", socket.id);
//   socket.on("new-marker", (markerPosition) => {
//     addMarker(markerPosition);
//     console.log("array de marcadres activos--->", activeMarkers);
//     onlyActiveMarkers = activeMarkers.filter((item) => item.markerId != "");
//     socket.broadcast.emit("emit-new-marker", onlyActiveMarkers); // everyone gets it but the sender
//   });

//   socket.on("moving-marker", (movingMarker) => {
//     console.log("movingMarker--->", movingMarker);
//     socket.broadcast.emit("moving-marker", movingMarker);
//   });
// });

//server.listen(port, () => console.log(`Example app listening on port ${port}`));
