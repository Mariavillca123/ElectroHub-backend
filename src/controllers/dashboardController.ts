import { Request, Response } from "express";
import { pool } from "../config/db";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [todaySales]: any = await pool.query(
      `SELECT SUM(total) AS total FROM sales WHERE DATE(date) = CURDATE()`
    );

    const [totalSales]: any = await pool.query(`SELECT SUM(total) AS total FROM sales`);
    const [bestProducts]: any = await pool.query(`
      SELECT p.name, SUM(s.quantity) AS sold
      FROM sales s
      JOIN products p ON s.product_id = p.id
      GROUP BY s.product_id
      ORDER BY sold DESC
      LIMIT 5
    `);

    res.json({
      todayTotal: todaySales[0].total || 0,
      allTimeTotal: totalSales[0].total || 0,
      bestProducts,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};
