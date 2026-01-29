import { Router } from "express"
import { getVendors } from "../controllers/vendorController"
import { verifyToken } from "../middleware/authMiddleware"

const router = Router()

router.get("/", verifyToken, getVendors)

export default router
