const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    await client.connect();

    const petCollection = client.db('petAdoption').collection('allPet')
    const adoptedPetCollection = client.db('petAdoption').collection('adoptedPet')
    const donationCampaignCollection = client.db('petAdoption').collection('donationCampaign')
    const paymentsCollection = client.db('petAdoption').collection('payments')
    // const myDonationCollection = client.db('petAdoption').collection('myDonation')


    app.get('/all-pets', async (req, res) => {
      const result = await petCollection.find().toArray();

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

    app.get('/adoptedPet', async(req, res) => {
      const result = await adoptedPetCollection.find().toArray();
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



    // get single donation campaigns from paymentsCollection
    app.get('/my-donation-campaigns/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) }
      const result = await paymentsCollection.findOne(query)
      res.send(result)
    })

    // get all the donation campaigns from paymentsCollection
    app.get('/donation-campaigns/:email', async (req, res) => {
      const email = req.params.email;

      const query = { email: email }
      const result = await paymentsCollection.find(query).toArray();
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