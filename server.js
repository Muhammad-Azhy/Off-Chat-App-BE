import { Server } from "socket.io"; //replaces (import socketIo from 'socket.io')
import cors from "cors";
import Express from "express";
import { PrismaClient } from "@prisma/client";
import http from "http";
import HomeCont from "./HomeCont.js"
import Chat from "./ChatCont.js"
import AuthUser from "./AuthCont.js"
import { getRoomName } from "./utils.js";
const prisma = new PrismaClient();
const app = Express();
const server = http.createServer(app);
const PORT = 3001;

app.use(cors());
app.use(Express.json());
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
  },
});
io.on("connection",(socket)=>{
  console.log(`User: ${socket.id[0]} has connected...`)
  socket.on('join_room', async(Ids, cb) => {
    if(cb === null){
      return;
    }
    const { myId, recipientId } = Ids;
    console.log('Hello',myId, recipientId);
        let roomName;
        if(myId === recipientId){
          console.log("dont talk to yourself");
          return
        }
        if(+myId > +recipientId){
            roomName = `room_${+recipientId}_${+myId}`;
        }
        else{
            roomName = `room_${+myId}_${+recipientId}`;
        }
        const room = await prisma.room.findFirst({where:{
          roomName
        }});
        if(room){
          socket.join(roomName);
          console.log(`User ${myId} joined room ${roomName}`);
        }
        else{
          await prisma.room.create({data:{
            roomName
          }})
          socket.join(roomName);
        }
        cb(roomName);
    });
    //calling sdp sockets here 
    socket.on("start_call", data=>{
      console.log(data);
      socket.emit("start_call", data)
    })
    socket.on("sdp", data=>{
      socket.broadcast.emit("sdp", data)
    })
    socket.on("candidate", candidate=>{
      socket.broadcast.emit("candidate", candidate)
    })
    socket.on("disconnect", ()=>{
        console.log(`${socket.id} has disconnected`);
    })

    //sending text
    socket.on("send_text", async data=>{ //title time roomName
      console.log(data);
      console.log(typeof(data));
        const {title , roomName, senderId, recipientId} = data;//sender is my id receiver is other Id
        console.log(data);
        const sender = await prisma.user.findFirst({
         where: { id: +senderId },
          select: { username: true },
         });
        const time = new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes();
        await prisma.room.findFirst({
        where: { roomName },
      }).then( async(room)=>{
           await prisma.message.create({
          data: {
            time,
            title,
            roomId: room.id,
            senderId,
            username: sender.username,
            recipientId
          },
        }).then(async(message)=>{
            await prisma.room.update({
          where: { id: room.id },
          data: { messages: { connect: { id: message.id } } },
        }).then(async (x)=>{
         const dataWithUsername = {
          title,
          time,
          roomName,
          senderId,
          recipientId,
          username: sender.username, // Include the sender's username
        };
        socket.to(roomName).emit("new_message", dataWithUsername);
        console.log(senderId + " sent " + title + " to " + recipientId);
        })
      });
    });
  });
})

app.use("/",AuthUser)
app.use("/", HomeCont)
app.use("/", Chat)
server.listen(3001,()=>{
    console.log(`Listening on Port: ${PORT}`);
})