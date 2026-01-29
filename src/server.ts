import app from "./app";
import { pool } from "./config/db";

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await pool.getConnection();
    console.log("✅ Conectado a la base de datos MySQL correctamente.");
    // Ensure sales status column exists for order processing
    try {
      await pool.query(`
        ALTER TABLE sales 
          ADD COLUMN IF NOT EXISTS status ENUM('pendiente','enviado','entregado','cancelado') DEFAULT 'pendiente',
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
      `);
      console.log("🛠️ Verificado/creado columnas de estado en 'sales'.");
    } catch (e) {
      console.warn("⚠️ No se pudo verificar columnas de estado en 'sales' (posible versión MySQL sin IF NOT EXISTS). Intentando verificación manual...");
      // Fallback: check information_schema and add columns if missing
      const [cols]: any = await pool.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='sales'"
      );
      const names = cols.map((c: any) => c.COLUMN_NAME);
      if (!names.includes("status")) {
        await pool.query(
          "ALTER TABLE sales ADD COLUMN status ENUM('pendiente','enviado','entregado','cancelado') DEFAULT 'pendiente'"
        );
      }
      if (!names.includes("updated_at")) {
        await pool.query(
          "ALTER TABLE sales ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        );
      }
      console.log("✅ Columnas de estado verificadas/agregadas.");
    }
    app.listen(PORT, () => console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Error al conectar con la base de datos:", err);
  }
})();
