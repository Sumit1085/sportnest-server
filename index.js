const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config()
const port = process.env.PORT

app.use(cors())


const uri = "mongodb+srv://sportnest:HEvHTAcPLZ2xxpov@phynamo.rhtqj88.mongodb.net/?appName=phynamo";

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

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    const db = client.db('sportnest')
    const facilityCollection = db.collection('facility')



    app.get('/facility', async (req, res) => {
      const cursor = facilityCollection.find();
      const result = await cursor.toArray()
      console.log(result)
      res.send(result)
    })
    app.get('/facility/:facilityId', async (req, res) => {
      const {facilityId} = req.params;
      const query = new ObjectId(facilityId)
      const result = await facilityCollection.findOne();
      res.send(result)
    })




    console.log("Pinged your deployment. You successfully connected to MongoDB!");




  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})