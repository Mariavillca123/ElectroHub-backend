import { Request, Response } from "express"
import { pool } from "../config/db"

export const getVendors = async (_: Request, res: Response) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE role IN ('vendedor','vendor')")
  res.json(rows)
}
