import { Metric } from "../models/Metric.js";
import moment from "moment";
// POST /api/metrics (single or multiple)
export const addMetric = async (req, res) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    const metrics = await Metric.insertMany(data);
    res.status(201).json(metrics);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/metrics?start=&end=&comparePrev=true
export const getMetrics = async (req, res) => {
  try {
    const { start, end, comparePrev } = req.query;

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Query current week
    const current = await Metric.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: "$date" }, // 1 = Sun, 2 = Mon...
            source: "$source",
          },
          totalAmount: { $sum: "$amount" },
          totalCovers: { $sum: "$covers" }, // 👈 thêm covers
        },
      },
      {
        $group: {
          _id: "$_id.day",
          metrics: {
            $push: {
              source: "$_id.source",
              totalAmount: "$totalAmount",
              totalCovers: "$totalCovers",
            },
          },
        },
      },
      {
        $sort: { _id: 1 }, // sắp xếp từ Sun -> Sat
      },
    ]);

    // Convert day number (1=Sunday ... 7=Saturday) → labels
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const formatted = {};

    current.forEach((row) => {
      const dayName = dayMap[row._id.day % 7];
      if (!formatted[dayName]) {
        formatted[dayName] = {
          day: dayName,
          posRevenue: 0,
          eatclubRevenue: 0,
          covers: 0,
          labourCost: 0,
        };
      }
      if (row._id.source === "POS") formatted[dayName].posRevenue = row.total;
      if (row._id.source === "Eatclub")
        formatted[dayName].eatclubRevenue = row.total;
      if (row._id.source === "Labour")
        formatted[dayName].labourCost = row.total;
    });

    const result = Object.values(formatted);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Compare metrics between current and previous week
export const compareMetrics = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "start and end dates required" });
    }

    const startDate = moment(start, "YYYY-MM-DD").startOf("day");
    const endDate = moment(end, "YYYY-MM-DD").endOf("day");

    // Previous week range
    const prevStart = startDate.clone().subtract(7, "days");
    const prevEnd = endDate.clone().subtract(7, "days");

    // Fetch current week
    const currentWeek = await Metric.find({
      date: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    }).lean();

    // Fetch previous week
    const previousWeek = await Metric.find({
      date: { $gte: prevStart.toDate(), $lte: prevEnd.toDate() },
    }).lean();

    res.json({ currentWeek, previousWeek });
  } catch (err) {
    console.error("❌ Error comparing metrics:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
