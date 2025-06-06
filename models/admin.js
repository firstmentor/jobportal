const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  Phone: { type: String, required: true },
  role: { type: String, enum: ['jobseeker', 'employer', 'admin'], default: 'jobseeker' },
  createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model('User', userSchema);
