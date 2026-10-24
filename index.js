import express from 'express'
import 'dotenv/config'
const app = express()
import { MongoClient } from 'mongodb'
const port = process.env.PORT || 5000

//middleware
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URI)

export async function connectToMongoDB() {
  try {
    await client.connect()
    console.log('You successfully connected to MongoDB!')
    return client
  } catch (err) {
    console.dir(err)
  }
}

const mongoClient = await connectToMongoDB()
const db = mongoClient.db('wanderly-travel')
const destinations = db.collection('destination')

// Routes destination => post api

app.post('/destination', async (req, res) => {
  try {
    const newDestinations = req.body
    const result = await destinations.insertOne(newDestinations)
    res.status(201).send(result)
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
