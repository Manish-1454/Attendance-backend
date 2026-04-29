const mongoose = require('mongoose');

const userSchema = mongoose.Schema({

  name:String,
  password: String,
  role: {
    type: String,
    enum: ['admin', 'manager', 'worker'],
    default:'worker'
  },
  gender: String,
  phonenumber: { type: String },
  salaryPerDay: Number,
  image: { type: String }, // 👈 store image filename or URL
});

module.exports = mongoose.model('User', userSchema);
