import express from "express";
import {
  addMetric,
  compareMetrics,
  getMetrics,
} from "../controllers/metricController.js";

const router = express.Router();

router.post("/", addMetric);
router.get("/", getMetrics);
router.get("/compare", compareMetrics); // new endpoint

export default router;
