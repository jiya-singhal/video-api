require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { addUser, findUser } = require('../models/userModel');

const router = express.Router();

// Use the secure key from environment variables
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

// Register route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (await findUser(username)) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Hash the password before saving
  const hashedPassword = bcrypt.hashSync(password, 10);
  await addUser(username, hashedPassword);
  res.status(201).json({ message: 'User registered successfully' });
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await findUser(username);
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  res.status(200).json({ token });
});

module.exports = router;
