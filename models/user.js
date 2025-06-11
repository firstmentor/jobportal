const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['jobseeker', 'recruiter', 'admin'], default: 'jobseeker' },
  status: { type: String, enum: ["pending", "approved"], default: "approved" },
  companyName: { type: String }, // ✅ Comma added after this line
  createdAt: { type: Date, default: Date.now },
  resetToken: String,
  resetTokenExpiry: Date,
});

module.exports = mongoose.model('user', userSchema);
