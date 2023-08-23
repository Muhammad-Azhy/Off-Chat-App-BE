import {io} from "./server.js"
import Express from "express";
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";
import { body, validationResult } from 'express-validator';
const prisma = new PrismaClient();
const router = Express.Router();

const validateUserInput = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(402).json({ errors: errors.array() });
    }
     const { username , password} = req.body;
    const existingUser = await prisma.user.findFirst({where:{
      username,
      password
    }});
    if (!existingUser) {
      return res.status(402).json({ error: 'User not found' });
    }

    next();
  },
];


router.post("/",  async (req, res)=>{
   const {username , password} = req.body;
   let userTaken = false
   const isTaken = await prisma.user.findFirst({where:{
      username
   }})
   if(isTaken === null){
    prisma.user.create({data:{password,username}}).then((x)=>{
    console.log(x);
    console.log(userTaken);
    })
}else{userTaken = true;}
res.send("Usernam")
})
router.post("/Login",validateUserInput ,async (req,res)=>{
const {username, password} = req.body
      const user = prisma.user.findFirst({where:{
      username,
      password
   }}).then((x)=>{
      console.log("IIDDD"+ x.id);
      const token = jwt.sign({myId:x.id},process.env.JWT_TOKEN)
      const data = {
        username:x.username,
        myId: x.id,
        token:token
      }
      console.log(data);
      res.send(data);
   });
})
export default router;