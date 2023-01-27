import cluster from 'cluster'
import express from "express";
import http from "http"; // modulo de node
import { Server as SocketServer } from "socket.io";
import { activeMarkers, addMarker } from "./models/marcadores.js";
import numCPUs from 'os'
import {setupMaster, setupWorker} from '@socket.io/sticky'
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter'




const cpu = numCPUs.cpus().length



const app = express();
const server = http.Server(app);

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const httpServer = http.createServer();

  setupMaster(httpServer, {
    loadBalancingMethod: "least-connection", // either "random", "round-robin" or "least-connection"
  });

  setupPrimary();

  httpServer.listen(3000);

  for (let i = 0; i < cpu; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  console.log(`Worker ${process.pid} started`);


  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', "https://track-your-people-front.vercel.app");
    next();
  });
  
  const io = new SocketServer(server, {
    path: '/socket.io',
    
    cors: {
      origin: ["https://track-your-people-front.vercel.app"],
      credentials: true,
      methods: ["GET", "POST"],
      allowedHeaders:['my-custom-header', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
    },
  });
  
  
  
  const port = 4000;
  
  app.get("/", (req, res) => {
    res.send("Hello World!");
  });
  
  
  
  let onlyActiveMarkers;


 
  io.adapter(createAdapter());
  setupWorker(io);


    /* ... */
  
    
    io.on("connection", (socket) => {
      console.log("a user connected");
      console.log('socket', socket.id);
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
    

}


// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', "https://track-your-people-front.vercel.app");
//   next();
// });

// const io = new SocketServer(server, {
//   path: '/socket.io',
  
//   cors: {
//     origin: ["https://track-your-people-front.vercel.app"],
//     credentials: true,
//     methods: ["GET", "POST"],
//     allowedHeaders:['my-custom-header', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
//   },
// });



// const port = 4000;

// app.get("/", (req, res) => {
//   res.send("Hello World!");
// });



// let onlyActiveMarkers;

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   console.log('socket', socket.id);
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

// server.listen(port, () => console.log(`Example app listening on port ${port}`));




