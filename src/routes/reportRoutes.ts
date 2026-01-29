import { Router } from "express";
import { getReportsInfo, getReportsSummary, generateSalesReport } from "../controllers/reportController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyToken, getReportsInfo);
router.get("/summary", verifyToken, getReportsSummary);
router.get("/sales-pdf", verifyToken, generateSalesReport);

export default router;
