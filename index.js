require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("habits-db");
    const habitsCollection = db.collection("habits");
    const usersCollection = db.collection("users");

    app.post("/habits", async (req, res) => {
      const habit = {
        ...req.body,
        createdAt: new Date(),
      };

      const result = await habitsCollection.insertOne(habit);
      res.send(result);
    });

    app.get("/habits", async (req, res) => {
      const result = await habitsCollection
        .find({ isPublic: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.send(result);
    });

    app.get('/habits/:id', async (req, res) => {
      const {id} = req.params
      const result = await habitsCollection.findOne({_id: new ObjectId(id)})
      console.log(id)

      res.send({
        success: true,
        result
      })
    })

    // My habits
    app.get("/my-habits", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).send({ message: "Email query is required" });
    }

    const result = await habitsCollection
      .find({ userEmail: email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Failed to load user habits" });
  }
});




    app.get("/public-habits", async (req, res) => {
      const result = await habitsCollection
        .find({ isPublic: true })
        .sort({ createdAt: -1 })
        .toArray();

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is ping on port ${port}`);
});
