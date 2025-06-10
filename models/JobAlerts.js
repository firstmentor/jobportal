// models/JobAlertPreference.js
import mongoose from "mongoose";

const JobAlertPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  categories: [String], // e.g. ["Web Development", "Marketing"]
  location: String,
  keywords: [String]
});

export default mongoose.model("JobAlertPreference", JobAlertPreferenceSchema);
