import { Request, Response } from "express";
import { pool } from "../config/db";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

// GET /api/reports → Información
export const getReportsInfo = async (req: any, res: Response) => {
  const vendor_id = req.user?.id;
  res.json({
    message: "Sistema de reportes ElectroHub",
    vendor_id,
    endpoints: [
      { method: "GET", path: "/api/reports/summary", desc: "Resumen de ventas y productos" },
      { method: "GET", path: "/api/reports/sales-pdf", desc: "Reporte PDF de ventas" }
    ]
  });
};

// GET /api/reports/summary → Datos de resumen para la página
export const getReportsSummary = async (req: any, res: Response) => {
  try {
    const vendor_id = req.user?.id;
    if (!vendor_id) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // Total ingresos
    const [revenueResult]: any = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total FROM sales WHERE vendor_id = ?`,
      [vendor_id]
    );
    const totalRevenue = revenueResult[0].total || 0;

    // Total ventas
    const [salesCountResult]: any = await pool.query(
      `SELECT COUNT(*) AS count FROM sales WHERE vendor_id = ?`,
      [vendor_id]
    );
    const totalSales = salesCountResult[0].count || 0;

    // Total productos
    const [productsCountResult]: any = await pool.query(
      `SELECT COUNT(*) AS count FROM products WHERE vendor_id = ?`,
      [vendor_id]
    );
    const totalProducts = productsCountResult[0].count || 0;

    res.json({
      totalRevenue: Number(totalRevenue),
      totalSales,
      totalProducts,
      currentDate: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
    });
  } catch (error) {
    console.error("Error en reportsSummary:", error);
    res.status(500).json({ error: "Error al obtener resumen" });
  }
};

// GET /api/reports/sales-pdf → Reporte PDF
export const generateSalesReport = async (req: any, res: Response) => {
  try {
    const vendor_id = req.user?.id;
    if (!vendor_id) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    // Obtener datos del vendedor
    const [vendorData]: any = await pool.query(
      `SELECT name FROM users WHERE id = ?`,
      [vendor_id]
    );
    const vendorName = vendorData[0]?.name || 'Vendedor';

    // Obtener ventas
    const [sales]: any = await pool.query(
      `SELECT s.id, s.quantity, s.total, s.status, s.created_at,
              p.name AS product_name, u.name AS client_name
       FROM sales s
       JOIN products p ON s.product_id = p.id
       JOIN users u ON s.user_id = u.id
       WHERE s.vendor_id = ?
       ORDER BY s.created_at DESC`,
      [vendor_id]
    );

    // Obtener productos
    const [products]: any = await pool.query(
      `SELECT id, name, category, price, stock, discount FROM products WHERE vendor_id = ?`,
      [vendor_id]
    );

    // Calcular métricas
    const totalRevenue = sales.reduce((sum: number, s: any) => sum + Number(s.total), 0);
    const totalSales = sales.length;
    const totalProducts = products.length;

    // Crear PDF
    const doc = new PDFDocument({ margin: 40 });
    const filename = `reporte-ventas-${vendor_id}-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Agregar logo - ruta correcta: 3 niveles arriba a raíz, luego frontend
    const logoPath = path.join(__dirname, '../../../frontend/src/assets/logo.png');
    
    try {
      if (fs.existsSync(logoPath)) {
        // Centrar logo en la página (ancho de página ~612, logo 160 = (612-160)/2 = 226)
        doc.image(logoPath, 226, 15, { width: 200, height: 170 });
        doc.moveDown(7.5);
      }
    } catch (err) {
      console.log('Error al cargar logo:', err);
    }

    // Título
    doc.fontSize(24).font('Helvetica-Bold').text('REPORTE DE VENTAS', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Vendedor: ${vendorName}`, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    // Resumen ejecutivo
    doc.fontSize(14).font('Helvetica-Bold').text('Resumen Ejecutivo', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`• Ingresos Totales: $${totalRevenue.toFixed(2)}`);
    doc.text(`• Total Ventas: ${totalSales}`);
    doc.text(`• Total Productos: ${totalProducts}`);
    doc.moveDown(1);

    // Sección de ventas
    if (sales.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Detalle de Ventas', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      // Header tabla
      const tableTop = doc.y;
      doc.text('Producto', 50, tableTop, { width: 150 });
      doc.text('Cliente', 210, tableTop, { width: 120 });
      doc.text('Qty', 340, tableTop, { width: 40 });
      doc.text('Monto', 390, tableTop, { width: 70 });
      doc.text('Estado', 470, tableTop, { width: 85 });

      doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();
      doc.moveDown(1);

      // Filas
      sales.forEach((sale: any) => {
        const y = doc.y;
        doc.fontSize(8).text(sale.product_name.substring(0, 20), 50, y, { width: 150 });
        doc.text(sale.client_name.substring(0, 15), 210, y, { width: 120 });
        doc.text(String(sale.quantity), 340, y, { width: 40, align: 'center' });
        doc.text(`$${Number(sale.total).toFixed(2)}`, 390, y, { width: 70 });
        doc.text(sale.status, 470, y, { width: 85 });
        doc.moveDown(0.8);
      });

      doc.moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    }

    // Sección de productos
    if (products.length > 0) {
      doc.moveDown(1);
      doc.fontSize(14).font('Helvetica-Bold').text('Inventario de Productos', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      const tableTop = doc.y;
      doc.text('Producto', 50, tableTop, { width: 150 });
      doc.text('Categoría', 210, tableTop, { width: 100 });
      doc.text('Precio', 320, tableTop, { width: 60 });
      doc.text('Stock', 390, tableTop, { width: 40 });
      doc.text('Descto', 440, tableTop, { width: 40 });

      doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();
      doc.moveDown(1);

      products.forEach((product: any) => {
        const y = doc.y;
        doc.fontSize(8).text(product.name.substring(0, 20), 50, y, { width: 150 });
        doc.text(product.category.substring(0, 15), 210, y, { width: 100 });
        doc.text(`$${Number(product.price).toFixed(2)}`, 320, y, { width: 60 });
        doc.text(String(product.stock), 390, y, { width: 40, align: 'center' });
        doc.text(`${product.discount}%`, 440, y, { width: 40 });
        doc.moveDown(0.8);
      });
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#999999').text('Reporte generado automáticamente por ElectroHub', { align: 'center' });
    doc.fillColor('#000000'); // Reset a color por defecto

    doc.end();
  } catch (error) {
    console.error("Error generando reporte:", error);
    res.status(500).json({ error: "Error al generar reporte", details: String(error) });
  }
};