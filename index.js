require('dotenv').config()
const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')

const app = express()
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json())



const uri = process.env.MONGO_URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db('habits-db')
    const habitsCollection = db.collection('habits')


    app.get('/habits', async (req, res) => {
      
      const result = await habitsCollection.find().toArray()
      
      res.send(result);
    })





    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Server is running')
})










app.listen(port, () => {
  console.log(`Server is ping on port ${port}`)
})
