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
    // const usersCollection = db.collection("users");

    app.post("/habits", async (req, res) => {
      try {
        const habit = {
          ...req.body,
          createdAt: new Date(),
        };
        const result = await habitsCollection.insertOne(habit);
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Failed to add habit" });
      }
    });

    app.get("/habits", async (req, res) => {
      try {
        const result = await habitsCollection
          .find({ isPublic: true })
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Failed to load habits" });
      }
    });

    app.get("/habits/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await habitsCollection.findOne({
          _id: new ObjectId(id),
        });
        res.send({
          success: true,
          result,
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Failed to load habit" });
      }
    });

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

    app.patch("/habits/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updatedHabit = req.body;
        const result = await habitsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: updatedHabit,
          }
        );
        res.send({ success: result.modifiedCount > 0 });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Failed to update habit" });
      }
    });

    app.delete("/habits/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await habitsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send({ success: result.deletedCount > 0 });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Failed to delete habit" });
      }
    });

    app.patch("/habits/:id/complete", async (req, res) => {
      try {
        const { id } = req.params;
        const today = new Date().toISOString().slice(0, 10);

        await habitsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $addToSet: { completionHistory: today } }
        );

        const habit = await habitsCollection.findOne({ _id: new ObjectId(id) });
        if (!habit) {
          return res
            .status(404)
            .send({ success: false, message: "Habit not found" });
        }

        const history = habit.completionHistory || [];

        const dates = history
          .map((iso) => new Date(iso))
          .filter((d) => !isNaN(d))
          .sort((a, b) => a - b);

        let currentStreak = 0;
        let bestStreak = 0;

        if (dates.length > 0) {
          currentStreak = 1;
          for (let i = dates.length - 2; i >= 0; i--) {
            const diff = (dates[i + 1] - dates[i]) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
              currentStreak++;
            } else {
              break;
            }
          }

          bestStreak = 1;
          let tempStreak = 1;
          for (let i = 0; i < dates.length - 1; i++) {
            const diff = (dates[i + 1] - dates[i]) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
              tempStreak++;
            } else {
              if (tempStreak > bestStreak) {
                bestStreak = tempStreak;
              }
              tempStreak = 1;
            }
          }
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        }

        const updateFields = {
          completionHistory: history,
          currentStreak,
          bestStreak,
        };

        await habitsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields }
        );

        res.send({
          success: true,
          message: "Marked complete and streak updated",
          updatedHabit: updateFields,
        });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Failed to mark complete" });
      }
    });

    app.get("/public-habits", async (req, res) => {
      try {
        const result = await habitsCollection
          .find({ isPublic: true })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .send({ success: false, message: "Failed to load public habits" });
      }
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
