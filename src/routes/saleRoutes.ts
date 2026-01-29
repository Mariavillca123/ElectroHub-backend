import { Router } from "express";
import { getSales, createSale, getSalesByClient, updateSaleStatus } from "../controllers/saleController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyToken, getSales);
router.post("/", verifyToken, createSale);
router.get("/by-client/:id", verifyToken, getSalesByClient);
router.put("/:id/status", verifyToken, updateSaleStatus);

export default router;
