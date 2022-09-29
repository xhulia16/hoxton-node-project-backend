import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const app = express();
app.use(express.json());
app.use(cors());
app.options("*", cors());

const port = 5126;

const SECRET = "ABC";

function getToken(id: number) {
  return jwt.sign({ id: id }, SECRET, { expiresIn: "5 days" });
}

async function getCurrentUser(token: string) {
  // @ts-ignore
  const { id } = jwt.verify(token, SECRET);
  const user = await prisma.user.findUnique({ where: { id: id } });
  return user;
}

// get personalized posts for user

app.get("/posts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const posts = await prisma.post.findMany({
      include: { user: true, comments: true, likes: true },
    });
    const following = await prisma.follows.findMany({
      where: { followerId: id },
    });

    let specificPosts = [];
    for (let item of posts) {
      for (let relationship of following) {
        if (relationship.followingId === item.userId) {
          //@ts-ignore
          specificPosts.push(item);
        }
      }
    }
    res.send(specificPosts);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
})

//  comment

app.get("/users/:id", async (req, res)=>{
  try{
    const id= Number(req.params.id)
    const user= await prisma.user.findUnique({
      where: {id}, 
      include:{followers: true, following:true, posts:true}})
      if(user){
        res.send(user)
      }
      else{
        res.status(404).send({error: "User not found!"})
      }
  }
  catch(error){
    //@ts-ignore
    res.status(400).send({error: error.message})
  }
})


// //  get all posts
// app.get("/posts", async (req, res) => {
//   try {
//     const posts = await prisma.post.findMany({
//       include: { user: true, comments: true, likes: true },
//     });
//     res.send(posts);

//   } catch (error) {
//     // @ts-ignore
//     res.status(400).send({ error: error.message });
//   }
// });

// get all users

app.get('/users', async(req, res)=>{
  try{
    const users = await prisma.user.findMany({
       include:{posts:true, likes:true, comments:true, followers:true, following:true}
    })
    res.send(users)
  } catch (error){
    // @ts-ignore
    res.status(400).send({error:error.message})
  }
})

//  get a specific post

app.get("/specificpost/:id", async (req, res) => {
  try {
    const postId = Number(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true, likes: true, comments: {include: {user:true}}},
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
    const post = await prisma.post.create({
      data: req.body,
      include: { user: true, comments: true, likes: true },
    });
    // send back all the posts to update state

    const posts = await prisma.post.findMany({
      include: { user: true, comments: true, likes: true },
    });
    const following = await prisma.follows.findMany({
      where: { followerId: req.body.userId },
    });

    let specificPosts = [];
    for (let item of posts) {
      for (let relationship of following) {
        if (relationship.followingId === item.userId) {
          //@ts-ignore
          specificPosts.push(item);
        }
      }
    }
    res.send(specificPosts);
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

// get all comments bla bla

app.get("/comments", async (req, res) => {
  try {
    const comment = await prisma.comment.findMany({
      include: {user: true },
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
    const comment = {
      postId: req.body.postId,
      userId: req.body.userId,
      comment: req.body.comment
    }
    const newComment = await prisma.comment.create({ 
      data: {postId: comment.postId, userId: comment.userId, comment: comment.comment}, 
      include:{user:true}
     });

    const post = await prisma.post.findUnique({
      where: { id: req.body.postId },
      include: { user: true, likes: true, comments: {include: {user:true}}},
    });


    res.send(post);
  } catch (error) {
    // @ts-ignore

    res.status(404).send({ error: error.message });
  }
});



app.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const passChanged = await prisma.user.update({
    where: { id },
    data: { password: bcrypt.hashSync(req.body.password) },
  });
  res.send(passChanged);
});
// comment

app.post("/sign-up", async (req, res) => {
  try {
    const match = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (match) {
      res.status(400).send({ error: "This email already exists" });
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password),
        },
      });
      res.send({ user: newUser, token: getToken(newUser.id) });
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

app.post("/sign-in", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.send({ user: user, token: getToken(user.id) });
    } else {
      res.status(400).send({ message: "User did not log in" });
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

// comment

app.get("/validate", async (req, res) => {
  try {
    if (req.headers.authorization) {
      const user = await getCurrentUser(req.headers.authorization);
      // @ts-ignore
      res.send({ user, token: getToken(user.id) });
    }
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

// get likes

app.get("/likes", async (req, res) => {
  const likes = await prisma.likes.findMany();
  res.send(likes);
});

//  like a post

app.post("/likeposts", async (req, res) => {
  const like = {
    postId: req.body.postId,
    userId: req.body.userId,
  };
  try {
    const likePost = await prisma.likes.create({
      data: {
        postId: like.postId,
        userId: like.userId,
      },
      include: { post: true },
    });

    const post = await prisma.post.findUnique({
      where: { id: like.postId },
      include: { user: true, likes: true, comments: true },
    });

    res.send(post);
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message });
  }
});

//  search for users

app.get('/search/:name', async (req,res)=>{
  const name = req.params.name
  const results = await prisma.user.findMany({
  where:{name:{  contains:name}}
  })
  res.send(results)
})

//  this is test

app.listen(port, () => {
  console.log(`yay : http://localhost:${port}`);
});
