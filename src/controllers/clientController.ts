import { Request, Response } from "express";
import { pool } from "../config/db";

export const getClients = async (_: Request, res: Response) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE role='cliente'");
  res.json(rows);
};

export const getClientsSummary = async (req: any, res: Response) => {
  const vendor_id = req.user?.id;
  if (!vendor_id) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }
  
  const [rows] = await pool.query(
    `SELECT 
      u.id, u.name, u.email, u.created_at,
      COUNT(DISTINCT s.id) AS orders,
      COALESCE(SUM(s.total), 0) AS spent
    FROM users u
    INNER JOIN sales s ON s.user_id = u.id AND s.vendor_id = ?
    WHERE u.role = 'cliente'
    GROUP BY u.id
    ORDER BY u.created_at DESC`,
    [vendor_id]
  );
  res.json(rows);
};

export const deleteClient = async (req: Request, res: Response) => {
  await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
  res.json({ message: "Cliente eliminado" });
};
