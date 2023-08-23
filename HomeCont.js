import {io} from "./server.js"
import Express from "express";
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";
import { body, validationResult } from 'express-validator';
const prisma = new PrismaClient();
const router = Express.Router();
router.get("/Home",async(req,res)=>{
    const data = []
await prisma.user.findMany({
    select:{
        username:true,
        id:true
    }
}).then((x)=>{
   res.send(x);
});
})

export default router;
