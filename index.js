const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

// midleWare
app.use(express.json())
app.use(cors())




// connect mongodb

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.50l1tkw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    await client.connect();
  
    const classCollection = client.db('summer').collection('classes');
    const instructorCollection = client.db('summer').collection('instructorCollection');
// classes
    app.get('/classes', async(req, res)=> {
      try {
        const result = await classCollection.find().toArray()
        res.send(result)
      } catch (error) {
        res.send(error)
      }
    })

  // instructor
    app.get('/instructors', async(req, res)=> {
      try {
        const result = await instructorCollection.find().toArray()
        res.send(result)
      } catch (error) {
        res.send(error)
      }
    })
     
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('summer is running ')
  })
  
  app.listen(port, () => {
    console.log(port, "port is okay");
  })
