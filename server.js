require('dotenv').config(); 
const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const Groq = require('groq-sdk');

const app = express();
const port = 3000;
// 3. Initialize Groq AI
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// MongoDB connection URI
const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'book4u';
const collectionName = 'users';
const client = new MongoClient(uri);

// File path for JSON storage
const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Helper function to hash password
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper to get DB collection
async function getCollection() {
    await client.connect();
    return client.db(dbName).collection(collectionName);
}

// Initial index creation
(async () => {
    try {
        const collection = await getCollection();
        await collection.createIndex({ email: 1 }, { unique: true });
        console.log('MongoDB unique index ensured.');
    } catch (err) {
        console.error('Error creating index:', err);
    }
})();

// Route to register a new user
// ==========================================
//  AI CHATBOT ROUTE
// ==========================================
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ reply: "Please say something!" });

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant for BOOK4U. answer in 2-3 sentences max. be concise and friendly." },
                { role: "user", content: userMessage }
            ],
            model: "llama-3.3-70b-versatile",
        });
        res.json({ reply: completion.choices[0]?.message?.content || "I'm not sure." });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ reply: "Error connecting to AI." });
    }
});
app.post('/api/register', async (req, res) => {
    try {
        const { fullname, username, email, address, password, confirmPassword } = req.body;

        // Validation
        if (!fullname || !username || !email || !address || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const collection = await getCollection();

        // Check if email already exists
        const existingUser = await collection.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Create new user
        const newUser = {
            fullname,
            username,
            email: email.toLowerCase(),
            address,
            password: hashPassword(password),
            createdAt: new Date().toISOString()
        };

        const result = await collection.insertOne(newUser);

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            user: {
                id: result.insertedId,
                fullname: newUser.fullname,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Route to login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const collection = await getCollection();

        // Find user by email
        const user = await collection.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        
        // Check password
        const hashedPassword = hashPassword(password);
        if (user.password !== hashedPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Login successful
        res.json({
            success: true,
            message: 'Login successful!',
            user: {
                id: user._id,
                fullname: user.fullname,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Route to create a new user (MongoDB - keeping for compatibility)
app.post('/api/users', async (req, res) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const user = req.body;

        // check if email already exists
        const existingUser = await collection.findOne({ email: user.email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const result = await collection.insertOne(user);

        res.status(201).json({ message: 'User created', userId: result.insertedId });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        await client.close();
    }
});

// Default route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index(1).html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Authentication system enabled`);
});