const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'half day'],
 
  },
  name:{
    type:String,
  },
  oT: {
    type: Number,
    default: 0,
  },
  salaryStatus:{
type:String,
enum:['paid','unpaid'],
default:'unpaid',
  },
  advance: {
    type: Number,
    default: 0,
  },
 salaryPerDay:{
  type:Number,
 },
  edited: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
 gender:String,
});

module.exports = mongoose.model('Attendance', attendanceSchema);
