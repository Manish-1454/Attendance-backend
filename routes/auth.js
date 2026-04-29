const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST: /api/auth/login
router.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name });
    if (!user) return res.status(400).send('User not found');

    const match = await User.findOne({password});
    if (!match) return res.status(400).send('Invalid password');

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET,);

    res.json({ token, role: user.role,id:user._id});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
