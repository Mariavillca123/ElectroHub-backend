import express from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { verifyToken } from "../middleware/authMiddleware";
const router = express.Router();

router.get("/stats", verifyToken, getDashboardStats);

export default router;
