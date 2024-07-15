require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { addUser, findUser } = require('../models/userModel');

const router = express.Router();
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET; // Use this key for JWT signing

console.log(`SECRET_KEY: ${SECRET_KEY}`); // Check if the secret key is loaded

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await findUser(username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log(`Registering user: ${username}`);
    const hashedPassword = bcrypt.hashSync(password, 10);
    await addUser(username, hashedPassword);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(`Error during registration: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await findUser(username);

    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log(`Logging in user: ${username}`);
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    console.log(`Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error(`Error during login: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
