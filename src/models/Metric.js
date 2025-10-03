import mongoose from "mongoose";

const metricSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  source: { type: String, enum: ["POS", "EatClub", "Labour"], required: true },
  amount: { type: Number, required: true },
  covers: { type: Number, default: 0 },
  tags: [String],
});

export const Metric = mongoose.model("Metric", metricSchema);
