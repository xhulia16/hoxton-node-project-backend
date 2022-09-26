import express from 'express'
import cors from 'cors'
import {PrismaClient} from '@prisma/client'


const prisma  = new PrismaClient()




const app = express()
app.use(express.json())
app.use(cors())

const port = 5126

app.get('/posts' , async (req, res)=>{
   const posts =  await prisma.post.findMany({include:{user:true, comments:true, likes:true}})
   res.send(posts)
})








app.listen(port, ()=>{
    console.log(`yay : http://localhost:${port}`)
})