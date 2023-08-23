import {io} from "./server.js"
import Express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer"
import { body , validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = Express.Router();

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
router.use("/Media", Express.static(path.join(__dirname, "Media")));
const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./Media");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const uploader = multer({ storage: fileStorageEngine });

router.get("/Chat/:roomName/:recipientId",async (req,res)=>{
const roomName = req.params.roomName;
const messagesInRoom = await prisma.message.findMany({
  where: {
    room: {
      roomName: roomName,
    },
  },
}).then((x) => {
  res.send(x);
});
});
router.delete("/Chat/:roomName/:recipientId", async(req,res)=>{
  const messageId = req.body;
  const message = await prisma.message.findFirst({where:{
    id:messageId
  }})
  if(message){
   prisma.message.delete({where:{
    id:messageId
  }}).then((x)=>{
    res.send("message deleted. . .")//what should i send back??
  });
}
else{
  res.send("message doesn't exist. . .")
}
})
router.post(
  '/Chat/:roomName/:recipientId',
  (req, res, next) => {
    try {
      uploader.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unexpected field: file' });
          }
        }
        next(err);
      });
    } catch (error) {
      next(error);
    }
  },
  [
    body('roomName').notEmpty(),
    body('senderId').notEmpty().isInt(),
    body('recipientId').notEmpty().isInt(),
    body('file').custom((value, { req }) => {
      if (!req.file) {
        throw new Error('File is required');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(402).json({ errors: errors.array() });
    }

    const { roomName, senderId, recipientId } = req.body;
    const file = req.file;
    const title = file.filename;
    const filePath = `http://localhost:3001/Media/${file.originalname}`;

    try {
      const room = await prisma.room.findFirst({
        where: { roomName },
      });

      if (room) {
        const message = await prisma.message.create({
          data: {
            time: new Date().getHours() + ':' + new Date().getMinutes(),
            title,
            roomId: room.id,
            senderId: +senderId,
            recipientId: +recipientId,
          },
        });

        const data = {
          time: message.time,
          title: message.title,
          roomId: room.id,
          senderId: message.senderId,
          recipientId: message.recipientId,
          filePath,
        };

        io.to(roomName).emit('new_message', data);
        return res.send(data);
      } else {
        return res.status(404).json({ error: 'Room not found' });
      }
    } catch (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);



export default router;