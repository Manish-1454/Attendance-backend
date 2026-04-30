const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name });
    if (!user) return res.status(400).send('User not found');

    if (user.password !== password) {
      return res.status(400).send('Invalid password');
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.json({ token, role: user.role, id: user._id });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;