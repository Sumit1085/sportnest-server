const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dns = require("node:dns");
// const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
// const JWKS = createRemoteJWKSet(
//   new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
// )

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// console.log(JWKS, 'jwks')

// const logger = (req, res, next) => {
//   console.log(req.params, 'from 1st');
//   next()
// }

// const verifyToken = async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   const token = authHeader?.startsWith('Bearer ')
//     ? authHeader.split(' ')[1]
//     : null;

//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized' });
//   }

//   try {
//     const { payload } = await jwtVerify(token, JWKS);

//     req.user = payload;
//     next();

//   } catch (error) {
//     console.error('Token validation failed:', error);

//     return res.status(401).json({
//       message: 'Invalid or expired token'
//     });
//   }
// };



async function run() {
  try {
    await client.connect();

    const db = client.db('sportnest');
    const facilityCollection = db.collection('facility');

    console.log("MongoDB connected");

    // GET all facilities
    app.get('/facility', async (req, res) => {
      try {
        const result = await facilityCollection.find().toArray();
        res.status(200).send(result);
      } catch (error) {
        console.error("GET /facility error:", error);
        res.status(500).send({ message: "Failed to fetch facilities" });
      }
    });

    // GET single facility
    app.get('/facility/:facilityId',  async (req, res) => {
      try {
        const { facilityId } = req.params;

        if (!ObjectId.isValid(facilityId)) {
          return res.status(400).send({ message: "Invalid facility ID" });
        }

        const query = { _id: new ObjectId(facilityId) };
        const result = await facilityCollection.findOne(query);

        if (!result) {
          return res.status(404).send({ message: "Facility not found" });
        }

        res.send(result);
      } catch (error) {
        console.error("GET /facility/:id error:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

  } catch (err) {
    console.error("MongoDB connection failed:", err);
  }
}

run();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});