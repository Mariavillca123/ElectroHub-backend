import { Request, Response } from "express";
import { pool } from "../config/db";

export const getProducts = async (_: Request, res: Response) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.vendor_id, p.name, p.category, p.price, p.stock, p.discount, p.image, p.created_at, u.name AS vendor_name
     FROM products p
     JOIN users u ON p.vendor_id = u.id
     ORDER BY p.created_at DESC`
  );
  res.json(rows);
};

export const getMyProducts = async (req: any, res: Response) => {
  const vendor_id = req.user?.id;
  
  if (!vendor_id) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  const [rows] = await pool.query(
    `SELECT p.id, p.vendor_id, p.name, p.category, p.price, p.stock, p.discount, p.image, p.created_at, u.name AS vendor_name
     FROM products p
     JOIN users u ON p.vendor_id = u.id
     WHERE p.vendor_id = ?
     ORDER BY p.created_at DESC`,
    [vendor_id]
  );
  res.json(rows);
};

export const getProduct = async (req: Request, res: Response) => {
  const [rows]: any = await pool.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
  res.json(rows[0]);
};

export const createProduct = async (req: any, res: Response) => {
  const { name, price, stock, category, discount = 0, image } = req.body;
  const vendor_id = req.user?.id;

  if (!vendor_id) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  try {
    await pool.query("INSERT INTO products (vendor_id, name, price, stock, category, discount, image) VALUES (?, ?, ?, ?, ?, ?, ?)", [
      vendor_id,
      name,
      price,
      stock,
      category,
      discount,
      image || null,
    ]);
    res.status(201).json({ message: "Producto agregado" });
  } catch (error) {
    res.status(400).json({ message: "Error al crear producto", error });
  }
};

export const updateProduct = async (req: any, res: Response) => {
  const { id } = req.params;
  const { name, price, stock, category, discount = 0, image } = req.body;
  const vendor_id = req.user?.id;

  if (!vendor_id) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  try {
    const [rows]: any = await pool.query("SELECT vendor_id FROM products WHERE id = ?", [id]);
    if (!rows.length || rows[0].vendor_id !== vendor_id) {
      return res.status(403).json({ message: "No tienes permiso para editar este producto" });
    }

    await pool.query("UPDATE products SET name=?, price=?, stock=?, category=?, discount=?, image=? WHERE id=?", [
      name,
      price,
      stock,
      category,
      discount,
      image || null,
      id,
    ]);
    res.json({ message: "Producto actualizado" });
  } catch (error) {
    res.status(400).json({ message: "Error al actualizar producto", error });
  }
};

export const deleteProduct = async (req: any, res: Response) => {
  const { id } = req.params;
  const vendor_id = req.user?.id;

  if (!vendor_id) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  try {
    const [rows]: any = await pool.query("SELECT vendor_id FROM products WHERE id = ?", [id]);
    if (!rows.length || rows[0].vendor_id !== vendor_id) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este producto" });
    }

    await pool.query("DELETE FROM products WHERE id=?", [id]);
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    res.status(400).json({ message: "Error al eliminar producto", error });
  }
};
