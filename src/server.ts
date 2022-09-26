import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(cors());

const port = 5126;

//  get all posts
app.get("/posts", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: { user: true, comments: true, likes: true },
    });
    res.send(posts);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

//  get a specific post

app.get("/posts/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true, likes: true, comments: true },
    })
    if(post){
        res.send(post);
    } else{
        res.status(404).send({error:'Post not Found!'})
    }
    
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`yay : http://localhost:${port}`);
});
