import { Request, Response } from "express";
import { pool } from "../config/db";

export const getSales = async (req: any, res: Response) => {
  const user_id = req.user?.id;
  const user_role = req.user?.role;
  
  let query: string;
  let params: any[];

  if (user_role === "vendor" || user_role === "vendedor") {
    // Los vendedores ven sus propias ventas
    query = `SELECT 
      s.id, 
      u.name AS client, 
      p.name AS product, 
      s.quantity, 
      s.total, 
      s.status,
      DATE_FORMAT(s.created_at, '%Y-%m-%d') AS date,
      s.created_at
    FROM sales s 
    JOIN users u ON s.user_id=u.id 
    JOIN products p ON s.product_id=p.id
    WHERE s.vendor_id = ?
    ORDER BY s.created_at DESC`;
    params = [user_id];
  } else {
    // Los clientes ven sus propias compras
    query = `SELECT 
      s.id, 
      u.name AS client, 
      p.name AS product, 
      s.quantity, 
      s.total, 
      s.status,
      DATE_FORMAT(s.created_at, '%Y-%m-%d') AS date,
      s.created_at
    FROM sales s 
    JOIN users u ON s.user_id=u.id 
    JOIN products p ON s.product_id=p.id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC`;
    params = [user_id];
  }

  const [rows] = await pool.query(query, params);
  res.json(rows);
};

export const createSale = async (req: any, res: Response) => {
  const { user_id, product_id, quantity } = req.body;

  const [productRows]: any = await pool.query("SELECT price, vendor_id FROM products WHERE id = ?", [product_id]);
  if (!productRows.length) return res.status(404).json({ message: "Producto no encontrado" });

  const price = productRows[0].price;
  const vendor_id = productRows[0].vendor_id;
  const total = price * quantity;

  await pool.query("INSERT INTO sales (vendor_id, user_id, product_id, quantity, total) VALUES (?, ?, ?, ?, ?)", [
    vendor_id,
    user_id,
    product_id,
    quantity,
    total,
  ]);

  res.status(201).json({ message: "Venta registrada" });
};

export const getSalesByClient = async (req: any, res: Response) => {
  const { id } = req.params;
  const vendor_id = req.user?.id;

  const [rows] = await pool.query(
    `SELECT 
      s.id,
      p.name AS product,
      s.quantity,
      s.total,
      s.status,
      s.created_at
     FROM sales s
     JOIN products p ON s.product_id = p.id
     WHERE s.user_id = ? AND s.vendor_id = ?
     ORDER BY s.created_at DESC`,
    [id, vendor_id]
  );
  res.json(rows);
};

export const updateSaleStatus = async (req: any, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const vendor_id = req.user?.id;

  if (!['pendiente','enviado','entregado','cancelado'].includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  // Verify vendor owns this sale
  const [rows]: any = await pool.query("SELECT vendor_id FROM sales WHERE id = ?", [id]);
  if (!rows.length || rows[0].vendor_id !== vendor_id) {
    return res.status(403).json({ message: "No tienes permiso para actualizar esta venta" });
  }

  await pool.query("UPDATE sales SET status=? WHERE id=?", [status, id]);
  res.json({ message: 'Estado actualizado' });
};
