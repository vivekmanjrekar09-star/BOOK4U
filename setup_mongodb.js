const url = 'mongodb://username:password@localhost:27017';const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'Book4U';

async function main() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    const db = client.db(dbName);

    // Create a "user" collection and insert sample data
    const usersCollection = db.collection('user');

    const sampleUsers = [
      { name: 'John Doe', email: 'john.doe@example.com', age: 30 },
      { name: 'Jane Smith', email: 'jane.smith@example.com', age: 25 },
    ];

    const result = await usersCollection.insertMany(sampleUsers);
    console.log(`${result.insertedCount} users inserted successfully.`);
  } catch (err) {
    console.error('An error occurred:', err);
  } finally {
    // Close the connection
    await client.close();
  }
}

main();