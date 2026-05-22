const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS and JSON parsing
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json());

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("MONGODB_URI environment variable is missing!");
    process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let facilitiesCollection;
let bookingsCollection;

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Use the 'sportnest' database
    db = client.db("sportnest");
    facilitiesCollection = db.collection("facilities");
    bookingsCollection = db.collection("bookings");

    console.log("Pinged your deployment. You successfully connected to MongoDB database 'sportnest'!");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}
run().catch(console.dir);

// Root endpoint
app.get('/', (req, res) => {
    res.send('SportNest Server is running fine');
});

// FACILITIES API

// GET /facility - Get all facilities
app.get('/facility', async (req, res) => {
    try {
        const query = {};
        const cursor = facilitiesCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.error("Error fetching facilities:", error);
        res.status(500).send({ message: "Failed to fetch facilities" });
    }
});

// GET /facility/:id - Get single facility details
app.get('/facility/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid ID format" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await facilitiesCollection.findOne(query);
        if (!result) {
            return res.status(404).send({ message: "Facility not found" });
        }
        res.send(result);
    } catch (error) {
        console.error("Error fetching facility details:", error);
        res.status(500).send({ message: "Failed to fetch facility details" });
    }
});

// POST /facility - Add a new facility with validation
app.post('/facility', async (req, res) => {
    try {
        const facilityData = req.body;
        
        // Basic input validation
        if (!facilityData.name || !facilityData.type || !facilityData.location || facilityData.price_per_hour === undefined) {
            return res.status(400).send({ message: "Missing required fields: name, type, location, and price_per_hour are required" });
        }

        // Make sure fields are correct
        const newFacility = {
            name: facilityData.name,
            type: facilityData.type,
            thumbnail: facilityData.thumbnail || facilityData.image, // supports both keys
            location: facilityData.location,
            price_per_hour: parseFloat(facilityData.price_per_hour),
            capacity: parseInt(facilityData.capacity || 1),
            available_slots: facilityData.available_slots || [],
            description: facilityData.description || "",
            owner_email: facilityData.owner_email || "",
            status: facilityData.status || "available",
            createdAt: new Date()
        };

        const result = await facilitiesCollection.insertOne(newFacility);
        res.status(201).send({ ...newFacility, _id: result.insertedId });
    } catch (error) {
        console.error("Error creating facility:", error);
        res.status(500).send({ message: "Failed to add facility" });
    }
});

// PUT /facility/:id - Update an existing facility with validation
app.put('/facility/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid ID format" });
        }
        
        const facilityData = req.body;
        if (!facilityData.name || !facilityData.type || !facilityData.location || facilityData.price_per_hour === undefined) {
            return res.status(400).send({ message: "Missing required fields: name, type, location, and price_per_hour are required" });
        }

        const filter = { _id: new ObjectId(id) };
        
        const updateDoc = {
            $set: {
                name: facilityData.name,
                type: facilityData.type,
                thumbnail: facilityData.thumbnail || facilityData.image,
                location: facilityData.location,
                price_per_hour: parseFloat(facilityData.price_per_hour),
                capacity: parseInt(facilityData.capacity || 1),
                available_slots: facilityData.available_slots || [],
                description: facilityData.description || "",
                status: facilityData.status || "available"
            }
        };

        const result = await facilitiesCollection.updateOne(filter, updateDoc);
        if (result.matchedCount === 0) {
            return res.status(404).send({ message: "Facility not found" });
        }
        res.send({ message: "Facility updated successfully", matchedCount: result.matchedCount });
    } catch (error) {
        console.error("Error updating facility:", error);
        res.status(500).send({ message: "Failed to update facility" });
    }
});

// DELETE /facility/:id - Delete a facility
app.delete('/facility/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid ID format" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await facilitiesCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            return res.status(404).send({ message: "Facility not found" });
        }
        res.send({ message: "Facility deleted successfully", deletedCount: result.deletedCount });
    } catch (error) {
        console.error("Error deleting facility:", error);
        res.status(500).send({ message: "Failed to delete facility" });
    }
});

// BOOKINGS API

// GET /booking - Get bookings (optionally filtered by email)
app.get('/booking', async (req, res) => {
    try {
        const email = req.query.email;
        let query = {};
        if (email) {
            query = { user_email: email };
        }
        const cursor = bookingsCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).send({ message: "Failed to fetch bookings" });
    }
});

// POST /booking - Create a new booking
app.post('/booking', async (req, res) => {
    try {
        const bookingData = req.body;
        const newBooking = {
            facility_id: bookingData.facility_id,
            facility_name: bookingData.facility_name,
            booking_date: bookingData.booking_date,
            time_slot: bookingData.time_slot,
            hours: parseInt(bookingData.hours || 1),
            total_price: parseFloat(bookingData.total_price),
            user_email: bookingData.user_email,
            user_name: bookingData.user_name || "Guest",
            status: bookingData.status || "pending",
            createdAt: new Date()
        };

        const result = await bookingsCollection.insertOne(newBooking);
        res.status(201).send({ ...newBooking, _id: result.insertedId });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).send({ message: "Failed to create booking" });
    }
});

// PATCH /booking/:id/cancel - Cancel a booking
app.patch('/booking/:id/cancel', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid ID format" });
        }
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: { status: "cancelled" }
        };
        const result = await bookingsCollection.updateOne(filter, updateDoc);
        if (result.matchedCount === 0) {
            return res.status(404).send({ message: "Booking not found" });
        }
        res.send({ message: "Booking cancelled successfully", matchedCount: result.matchedCount });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).send({ message: "Failed to cancel booking" });
    }
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});