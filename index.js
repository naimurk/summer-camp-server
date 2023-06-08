const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const stripe = require("stripe")('sk_test_51NFV1sCJxnWqbAIJfVOOrL4GqlS9x7P1Wk45p0GZu3Tuokk1GtY9Y5SMukFBJrVbRmnMxhfFAfjfbSNy0mM1Gqmf00UkaWgpKH')

require('dotenv').config();

// Middleware
app.use(express.json());
app.use(cors());

// Verify token middleware
const verifyJwt = (req, res, next) => {
  const authorization = req.headers?.authorization;
  if (!authorization) {
    return res.status(404).send({ error: true, message: 'No token' });
  }

  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: true, message: 'Unauthorized access' });
    }

    req.decoded = decoded;
    next();
  });
};

// Connect to MongoDB
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.50l1tkw.mongodb.net/?retryWrites=true&w=majority`;
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

    const classCollection = client.db('summer').collection('classes');
    const instructorCollection = client.db('summer').collection('instructorCollection');
    const userCollection = client.db('summer').collection('users');
    const cartCollection = client.db('summer').collection('carts');

    // JSON Web Token create API
    app.post('/jwt', (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.send({ token });
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // Classes API
    app.get('/classes', async (req, res) => {
      try {
        const result = await classCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // Instructors API
    app.get('/instructors', async (req, res) => {
      try {
        const result = await instructorCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // User registration API
    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await userCollection.findOne(query);

        if (existingUser) {
          return res.send({ message: 'User already exists' });
        }

        const result = await userCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // All users API
    app.get('/all-users', async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // Check if user is admin API
    app.get('/users/admin/:email', verifyJwt, async (req, res) => {
      try {
        const email = req.params.email;
        if (req.decoded.email !== email) {
          return res.send({ admin: false });
        }

        const query = { email: email };
        const user = await userCollection.findOne(query);
        const result = { admin: user?.role === 'admin' };
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // Check if user is instructor API
    app.get('/users/instructor/:email', verifyJwt, async (req, res) => {
      try {
        const email = req.params.email;
        if (req.decoded.email !== email) {
          return res.send({ admin: false });
        }

        const query = { email: email };
        const user = await userCollection.findOne(query);
        const result = { admin: user?.role === 'instructor' };
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // Check if user is student API
    app.get('/users/student/:email', verifyJwt, async (req, res) => {
      try {
        const email = req.params.email;
        if (req.decoded.email !== email) {
          return res.send({ admin: false });
        }

        const query = { email: email };
        const user = await userCollection.findOne(query);
        const result = { admin: user?.role === 'student' };
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // Cart creation API
    app.post('/carts', async (req, res) => {
      try {
        const item = req.body;
        const result = await cartCollection.insertOne(item);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

    // Get user's carts API
    app.get('/my-carts', verifyJwt, async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res.send([]);
        }

        const decodedEmail = req.decoded.email;
        if (email !== decodedEmail) {
          return res.status(403).send({ error: true, message: 'Forbidden access' });
        }

        const query = { email: email };
        const result = await cartCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: true, message: 'Internal server error' });
      }
    });

  //  Cart delete api 
  app.delete('/carts/:id', async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await cartCollection.deleteOne(query)
    res.send(result)
  })


  // stripe  api
  app.post('/create-payment-intent', verifyJwt, async (req, res) => {
    try {
      const { price } = req.body;
  
      if (!price) {
        return res.status(400).send('Price is missing');
      }
  
      const amount = Math.round(100 * price); // Convert price to cents
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
  
      res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'An error occurred' });
    }
  });
   




    // Default route
    app.get('/', (req, res) => {
      res.send('Summer is running');
    });

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Close the MongoDB connection when finished
    // await client.close();
  }
}

run().catch(console.error);
