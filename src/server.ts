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
    });
    if (post) {
      res.send(post);
    } else {
      res.status(404).send({ error: "Post not Found!" });
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

//  create a post

app.post("/posts", async (req, res) => {
  try {
    const post = await prisma.post.create({ data: req.body });
    res.send(post);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

//  delete a post

app.delete("/posts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const post = await prisma.post.delete({ where: { id } });
    res.send(post);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

// get all comments

app.get("/comments", async (req, res) => {
  try {
    const comment = await prisma.comment.findMany({
      include: { post: true, user: true },
    });
    res.send(comment);
  } catch (error) {
    // @ts-ignore
    res.status(404).send({ error: error.message });
  }
});
//  create  a new comment

app.post("/comments", async (req, res) => {
  try {
    const comment = await prisma.comment.create({ data: req.body });
    res.send(comment);
  } catch (error) {
    // @ts-ignore

    res.status(404).send({ error: error.message });
  }
});

// comment



app.listen(port, () => {
  console.log(`yay : http://localhost:${port}`);
});
