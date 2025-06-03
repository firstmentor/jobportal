const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "job",
    required: true
  },
  resume: {
    public_id: String,
    url: String
  },
  coverLetter: String,
  appliedAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model("JobApplication", jobApplicationSchema);
