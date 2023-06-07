const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config()

// midleWare
app.use(express.json())
app.use(cors())


// verify token midleware
const verifyJwt = (req, res, next) => {
  const authorization = req.headers?.authorization;
  // console.log('authorization', authorization);
  if (!authorization) {
    res.status(404).send({ error: true, message: 'no token' })
  }
  else {
    const token = authorization.split(' ')[1];
    // console.log( 'token',token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).send({ error: true, message: 'unauthorized access' })
      }
      else {
        req.decoded = decoded
        // console.log(req.decoded.email);
        next()
      }
    })
  }
}




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
    const userCollection = client.db('summer').collection('users')


    // json web token create api
    app.post('/jwt', (req, res) => {
      try {
        const user = req.body;
        // console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.send({ token })
      } catch (error) {
        res.send(error)
      }
    })



    // classes
    app.get('/classes', async (req, res) => {
      try {
        const result = await classCollection.find().toArray()
        res.send(result)
      } catch (error) {
        res.send(error)
      }
    })

    // instructor
    app.get('/instructors', async (req, res) => {
      try {
        const result = await instructorCollection.find().toArray()
        res.send(result)
      } catch (error) {
        res.send(error)
      }
    })

    // user collection 
    app.post('/users', async (req, res) => {
      try {
        const user = req.body;

        // console.log(user.email);
        const query = { email: user.email }
        const existingUser = await userCollection.findOne(query)
        // console.log('existing user', existingUser);
        if (existingUser) {
          res.send({ message: 'user already exist' })
        }
        else {
          const result = await userCollection.insertOne(user);
          res.send(result)
        }

      } catch (error) {
        res.send(error)
      }
    })

    // all user 
    app.get('/users', async (req, res) => {

      const result = await userCollection.find().toArray()
      res.send(result)

    })



    // (_________ is Admin apis_______)
    app.get('/users/admin/:email', verifyJwt, async (req, res) => {
      try {

        const email = req.params.email;
        if (req.decoded.email !== email) {
          res.send({ admin: false });
        }
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const result = { admin: user?.role === 'admin' };
        // console.log(result);
        res.send(result)

      } catch (error) {
        res.send(error.name, error.message)
      }
    })
    // (_________ is instructor apis_______)
    app.get('/users/instructor/:email', verifyJwt, async (req, res) => {
      try {

        const email = req.params.email;
        if (req.decoded.email !== email) {
          res.send({ admin: false });
        }
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const result = { admin: user?.role === 'instructor' };
        // console.log(result);
        res.send(result)

      } catch (error) {
        res.send(error.name, error.message)
      }
    })
    // (_________ is student apis_______)
    app.get('/users/student/:email', verifyJwt, async (req, res) => {
      try {

        const email = req.params.email;
        if (req.decoded.email !== email) {
          res.send({ admin: false });
        }
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const result = { admin: user?.role === 'student' };
        // console.log(result);
        res.send(result)

      } catch (error) {
        res.send(error.name, error.message)
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
