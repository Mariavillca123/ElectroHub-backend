import { Router } from "express";
import { getClients, deleteClient, getClientsSummary } from "../controllers/clientController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", verifyToken, getClients);
router.get("/summary", verifyToken, getClientsSummary);
router.delete("/:id", verifyToken, deleteClient);

export default router;
