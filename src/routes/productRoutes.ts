import { Router } from "express";
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getMyProducts } from "../controllers/productController";
import { verifyToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getProducts);
router.get("/my-products", verifyToken, getMyProducts);
router.get("/:id", getProduct);
router.post("/", verifyToken, createProduct);
router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

export default router;
