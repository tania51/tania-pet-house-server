const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_PAYMENT_KEY)

const cors = require('cors')
const port = process.env.PORT || 5008

// parser
app.use(cors())
app.use(express.json())


// mongodb setup


const uri = "mongodb+srv://petAdoption:c9VkMSd4eNWR4rJG@cluster0.jwathvu.mongodb.net/?retryWrites=true&w=majority"

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
    // await client.connect();

    const petCollection = client.db('petAdoption').collection('allPet')
    const usersCollection = client.db('petAdoption').collection('users')
    const adoptedPetCollection = client.db('petAdoption').collection('adoptedPet')
    const donationCampaignCollection = client.db('petAdoption').collection('donationCampaign')
    const paymentsCollection = client.db('petAdoption').collection('payments')
    const addedCollection = client.db('petAdoption').collection('added-pets')
    // const myDonationCollection = client.db('petAdoption').collection('myDonation')

    app.post('/jwt-users', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JSON_ACCESS_TOKEN_SECRET, {expiresIn: '1hr'})

      res.send({token})
    })


    app.get('/all-pets', async (req, res) => {
      
      const query = {}
      const options = {
        sort: {
          date: -1
        }
      }
      const result = await petCollection.find(query, options).toArray();

      res.send(result)
    })

    // sorting pets for pet listing

    app.get('/all-sort-pets', async (req, res) => {
      // const filter = req.query;
      // console.log(filter);

      const query = {adopted: false}
      const options = {
        sort: {
          date: -1
        }
      }
      const result = await petCollection.find(query, options).toArray();

      res.send(result)
    })

    app.get('/all-pets/:email', async (req, res) => {
      const email = req.params.email;

      const query = { email: email }
      const result = await petCollection.find(query).toArray();
      res.send(result)
    })

    app.get('/all-pets/petDetails/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) }
      const result = await petCollection.findOne(query)
      // console.log(result);
      res.send(result)
    })

    // add pet in allPets
    app.post('/all-pets', async(req, res) => {
      const query = req.body;
      const result = await petCollection.insertOne(query)
      res.send(result)
    })

    app.post('/all-added-pets', async(req, res) => {
      const query = req.body;
      const result = await addedCollection.insertOne(query)
      res.send(result)
    })

    app.get('/my-added-pets', async(req, res) => {
      const result = await addedCollection.find().toArray();
      res.send(result)
    })

    // adopted pet post and  // adopted pet status updated from db
    app.post('/adoptedPet', async (req, res) => {
      const query = req.body;
      const filter = { _id: new ObjectId(query.pet_id) }

      const updateDoc = {
        $set: {
          adopted: true
        }
      }
      const adoptedUpdatedResult = await petCollection.updateOne(filter, updateDoc)


      const result = await adoptedPetCollection.insertOne(query);
      res.send({result, adoptedUpdatedResult})
    })


    // users api
    app.post('/users', async(req, res) => {
      const query = req.body;
      const userEmail = {email: query.email}
      const emailIsExists = await usersCollection.findOne(userEmail)

      if(emailIsExists) {
        return res.send({ message: 'User Already Exists', insertedId: null })
      }

      const result = await usersCollection.insertOne(query)
      res.send(result)
    })

    app.get('/users', async(req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    //is Admin check
    app.get('/users/admin/:email', async(req, res) => {
      const email = req.params.email;
      console.log(email);
      // if(email !== req.decoded.email) {
      //   return res.status(403).send({message : 'unAuthorized'})
      // }
      const query = {email : email} 
      const user = await usersCollection.findOne(query);
      if(user) {
        admin = user?.role === 'admin'
      }
      // console.log(admin);
      res.send({admin})

    })

    // update user role user to admin
    app.patch('/users/:id', async (req, res) => {
      // const {role} = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }

      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }

      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    
    


    // adopted pet get by id for dashboard > admin
    app.get('/adoptedPet', async(req, res) => {
      const result = await adoptedPetCollection.find().toArray();
      res.send(result)
    })

    // adopted pet get by id for dashboard > users > adoption request
    app.get('/adoptedPet/:email', async (req, res) => {
      const email = req.params.email;

      const query = { email: email }
      const result = await adoptedPetCollection.find(query).toArray();
      res.send(result)
    })

   
    // app.post('/payments', async (req, res) => {
    //   const payment = req.body;

    //   // update price by payment amount
    //   const filter = { _id: new ObjectId(payment.pet_obj_id) }

    //   const updateDoc = {
    //     $set: {
    //       donated_amount: payment.total_donation_amount
    //     }
    //   }

    //   const result = await petCollection.updateOne(filter, updateDoc)

    //   const paymentResult = await paymentsCollection.insertOne(payment)
    //   res.send({ paymentResult, result })
    // })
    


    // user dashBoard
    // create donation campaign
    app.post('/donation-campaign', async(req, res) => {
      const query = req.body;
      const result = await donationCampaignCollection.insertOne(query)
      res.send(result)
    })

    // donation campaign pet get
    app.get('/donation-campaign', async(req, res) => {
      const result = await donationCampaignCollection.find().toArray();
      res.send(result);
    })

    // single donation campaign single item
    // app.get('/donation-campaigns/:id', async(req, res) => {
    //   const id = req.params.id;
    //   const query = {_id: new ObjectId(id)}
    //   const result = await paymentsCollection.findOne(query);
    //   res.send(result)
    // })


    // from donation campaign page
    // stripe payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card']
        })

        res.send({
          clientSecret: paymentIntent.client_secret
        })

    })


    


    // donation campaign
    // save payment info using post method
    app.post('/payments', async (req, res) => {
      const payment = req.body;

      // update price by payment amount
      const filter = { _id: new ObjectId(payment.pet_obj_id) }

      const updateDoc = {
        $set: {
          donated_amount: payment.total_donation_amount
        }
      }

      const result = await petCollection.updateOne(filter, updateDoc)

      const paymentResult = await paymentsCollection.insertOne(payment)
      res.send({ paymentResult, result })
    })


    // update price from my donation
    app.post('/my-donation', async (req, res) => {
      const payment = req.body;

      // update price by payment amount
      const filter = { _id: new ObjectId(payment.pet_obj_id) }

      const updateDoc = {
        $set: {
          donated_amount: payment.price
        }
      }
      // console.log(donated_amount);

      const result = await petCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // post my donation from User dashboard
    // app.post('/my-donation2', async(req, res) => {
    //   const query = req.body;
    //   const result = await myDonationCollection.insertOne(query)
    //   res.send(result)
    // })



    // get all donation campaigns from paymentsCollection
    app.get('/my-donation-campaigns', async (req, res) => {
      const result = await paymentsCollection.find().toArray()
      res.send(result)
    })

    // get single donation campaigns from paymentsCollection
    app.get('/my-donation-campaigns/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) }
      const result = await paymentsCollection.findOne(query)
      res.send(result)
    })
    
    // delete 
    app.delete('/my-donation-campaigns/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await paymentsCollection.deleteOne(query)
      res.send(result)
    })

    // get all the donation campaigns from paymentsCollection
    app.get('/donation-campaigns/:email', async (req, res) => {
      const email = req.params.email;

      const query = { email: email }
      const result = await paymentsCollection.find(query).toArray();
      res.send(result)
    })


    
    //admin dashboard
    // app.delete('/all-pets/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) }
    //   const result = await petCollection.deleteOne(query)
    //   res.send(result)
    // })
    app.delete('/my-added-pets/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await addedCollection.deleteOne(query)
      res.send(result)
    })

    // update adopted
    // update user
    // app.patch('/all-pets/:id', async (req, res) => {
    //   const {adopted} = req.body;
    //   const id = req.params.id;
    //   const filter = { _id: new ObjectId(id) }

    //   const updateDoc = {
    //     $set: {
    //       adopted: !adopted
    //     }
    //   }

    //   const result = await petCollection.updateOne(filter, updateDoc)
    //   res.send(result)
    // })

    app.patch('/my-added-pets/:id', async (req, res) => {
      const {adopted} = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }

      const updateDoc = {
        $set: {
          adopted: !adopted
        }
      }

      const result = await addedCollection.updateOne(filter, updateDoc)
      res.send(result)
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
  res.send('Pet server working perfectly')
})

app.listen(port, () => {
  console.log(`Pet server is running on ${port}`)
})