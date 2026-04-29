// middleware/auth.js

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send('No token provided');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Store user info in req.user
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};
