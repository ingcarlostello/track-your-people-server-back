
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import cluster from 'cluster'
import sticky from 'sticky-session'
import http from 'http'




  

const app = express();
//app.use(cors());

const port = 4000;

const server = http.Server(app);

app.get("/", (req, res) => {
  console.log('worker: ' + cluster.worker.id);
  res.send("Hello World!");
});

// const server = app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });




if(!sticky.listen(server,port))
{
  server.once('listening', function() {
    console.log('Server started on port '+port);
  });

  if (cluster.isMaster) {
    console.log('Master server started on port '+port);
  } 
}
else {
    console.log('- Child server started on port '+port+' case worker id='+cluster.worker.id);
  }






const io = new Server(server, {

    transports: [ "polling", "websocket"  ],
      cors: {
        
            // origin: 'http://127.0.0.1:5173'
            //origin: 'https://track-your-people-front.vercel.app',
            origin: '*',
            methods: ["GET", "POST"],
            credentials: true,

     
            
      }
});






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
