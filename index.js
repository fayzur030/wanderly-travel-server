import express from 'express'
import 'dotenv/config'
import cors from 'cors'
const app = express()
import { MongoClient, ObjectId } from 'mongodb'
import { createRemoteJWKSet, jwtVerify } from 'jose'
const port = 5000

//middleware
app.use(express.json())
app.use(cors())

//Todo: Middleware token verification

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  console.log(authHeader)
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized' })
  }
  const token = authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized' })
  }
  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
    )

    const { payload } = await jwtVerify(token, JWKS)
    console.log(payload)
  } catch (error) {
    console.error('Token verification failed:', error)
    return res.status(401).send({ message: 'Invalid token' })
  }

  next()
}

const client = new MongoClient(process.env.MONGODB_URI)

// export async function connectToMongoDB() {
//   try {
//     await client.connect()
//     console.log('You successfully connected to MongoDB!')
//     return client
//   } catch (err) {
//     console.error('MongoDB connection failed:', err)
//   }
// }
export async function connectToMongoDB() {
  try {
    await client.connect()
    console.log('You successfully connected to MongoDB!')
    return client
  } catch (err) {
    console.error('MongoDB connection failed:', err)
    throw err
  }
}

const mongoClient = await connectToMongoDB()
const db = mongoClient.db('wanderly-travel')
const destinations = db.collection('destination')
const bookingCollection = db.collection('bookings')

//Booking routes
//booking post api: localhost:5000/bookings
app.post('/bookings', async (req, res) => {
  try {
    const bookingDestination = await req.body
    // console.log(bookingDestination)
    const result = bookingCollection.insertOne(bookingDestination)
    res.status(201).send(result)
  } catch (error) {
    console.log(error)
    res.status(500).send({
      error: 'Internal Server Error',
    })
  }
})

// get booking data api
//get api: localhost:5000/my-bookings
app.get('/my-bookings/:email', verifyToken, async (req, res) => {
  try {
    const { email } = req.params
    const result = await bookingCollection
      .find({ 'user.email': email })
      .toArray()
    res.status(200).send({
      status: 200,
      message: 'Destination fetched successfully',
      data: result,
    })
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' })
  }
})

// single booking data

// DELETE a booking by ID
app.delete('/delete-booking/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params

    // Delete booking using its ID
    const result = await bookingCollection.deleteOne({
      _id: id,
    })

    // Check whether booking exists
    if (result.deletedCount === 0) {
      return res.status(404).send({
        status: 404,
        message: 'Booking not found',
      })
    }

    // Send success response
    res.status(200).send({
      status: 200,
      message: 'Booking deleted successfully',
      data: result,
    })
  } catch (error) {
    console.error('Error deleting booking:', error)

    res.status(500).send({
      status: 500,
      message: 'Internal Server Error',
    })
  }
})

// Destination routes

// get api: localhost:5000/destinations
app.get('/destinations', async (req, res) => {
  try {
    const result = await destinations.find().toArray()

    res.status(200).send({
      status: 200,
      message: 'Destinations fetched successfully',
      data: result,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send('Failed to fetch destinations')
  }
})

//Todo: feature destination api

app.get('/feature-destination', async (req, res) => {
  try {
    const featureDestination = await destinations.find().limit(5).toArray()
    res.status(200).send({
      status: 200,
      message: 'Feature Destinations fetched successfully',
      data: featureDestination,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send('Failed to fetch destinations')
  }
})

//post api:localhost:5000/add-destination

app.post('/add-destination', verifyToken, async (req, res) => {
  try {
    const newDestinations = req.body
    const result = await destinations.insertOne(newDestinations)
    res.status(201).send(result)
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: 'Internal Server Error' })
  }
})

// single data api: localhost:5000/destination/:id

app.get('/destination/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const result = await destinations.findOne({ _id: new ObjectId(id) })
    res.status(200).send({
      status: 200,
      message: 'Destination fetched successfully',
      data: result,
    })
  } catch (error) {
    res.status(500).send({ error: 'Internal Server Error' })
  }
})

// update api: localhost:5000/update-destination/:id
app.patch('/update-destination/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const updatedData = req.body
    const result = await destinations.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedData },
      { returnDocument: 'after' }
    )
    res.status(200).send({
      status: 200,
      message: 'Destination updated successfully',
      data: result,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: 'Internal Server Error' })
  }
})

// delete api : localhost:5000/delete-destination/:id

app.delete('/delete-destination/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params
    const result = await destinations.deleteOne({ _id: new ObjectId(id) })
    res.status(200).send({
      status: 200,
      message: 'Destination deleted successfully',
      data: result,
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ error: 'Internal Server Error' })
  }
})

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to Wanderly Travel API' })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
export default app
