import express from 'express'
import cors from 'cors'
import {PrismaClient} from '@prisma/client'


const prisma  = new PrismaClient()




const app = express()
app.use(express.json())
app.use(cors())

const port = 5126

app.get('/posts' , async (req, res)=>{
   try{
    const posts =  await prisma.post.findMany({include:{user:true, comments:true, likes:true}})
     res.send(posts)
    } catch (error){
        // @ts-ignore
        res.status(400).send({error:error.message})
    }
})








app.listen(port, ()=>{
    console.log(`yay : http://localhost:${port}`)
})