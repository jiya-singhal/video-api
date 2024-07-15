require('dotenv').config();
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) {
      console.log('No token provided');
      return res.sendStatus(401);
    }
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        console.log('Token verification failed:', err);
        return res.sendStatus(403);
      }
      req.user = user;
      console.log('Token verified successfully');
      next();
    });
  }

  
module.exports = authenticateToken;
