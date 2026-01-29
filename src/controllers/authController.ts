import { Request, Response } from "express";
import { pool } from "../config/db";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  try {
    // Validar que el rol sea cliente o vendedor
    if (!["cliente", "vendedor"].includes(role)) {
      return res.status(400).json({ message: "Rol inválido" });
    }

    // Verificar si el email ya existe
    const [existing]: any = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    // Insertar usuario sin encriptar contraseña
    await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, role]
    );

    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password, isAdmin } = req.body;

  try {
    // Buscar usuario
    const [users]: any = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const user = users[0];

    // Verificar contraseña sin encripción
    if (password !== user.password) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Si se intenta login como admin, verificar el rol
    if (isAdmin && user.role !== "admin") {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
};