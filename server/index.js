import express from "express";
import http from "http";
import morgan from "morgan";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import { resolve } from "path";

import { PORT } from "./config.js";
import { pool } from "./db.js";

// ───────────────────────────────────────────
// SISTEMA PARA BLOQUEAR LOGIN DUPLICADO
// ───────────────────────────────────────────
const usuariosConectados = new Set();

// Initializations
const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: "http://localhost:5173" },
});

// Middlewares
app.use(cors({ origin: "http://localhost:5173" }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ───────────────────────────────────────────
// LOGIN — Verifica usuario y evita doble login
// ───────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Faltan datos" });

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuario WHERE username = ? AND password = ?",
      [username, password]
    );

    if (rows.length === 0)
      return res
        .status(401)
        .json({ message: "Usuario o password incorrectos" });

    const user = rows[0];

    // 🔐 BLOQUEAR LOGIN REPETIDO
    if (usuariosConectados.has(username)) {
      return res
        .status(403)
        .json({ message: "Este usuario ya está conectado." });
    }

    usuariosConectados.add(username);

    res.json({ ok: true, username: user.username, userId: user.id });
  } catch (error) {
    console.error("Error en /api/login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// ───────────────────────────────────────────
// CRUD DE SALAS
// ───────────────────────────────────────────

// Crear sala
app.post("/api/salas", async (req, res) => {
  const { titulo, max_usuarios, es_privada, password, creador_id } = req.body;

  try {
    const [result] = await pool.query(
      "INSERT INTO sala (titulo, max_usuarios, es_privada, password, creador_id) VALUES (?, ?, ?, ?, ?)",
      [titulo, max_usuarios, es_privada, password || null, creador_id]
    );

    res.json({ ok: true, sala_id: result.insertId });
  } catch (error) {
    console.error("Error creando sala:", error);
    res.status(500).json({ message: "Error creando sala" });
  }
});

// Listar salas
app.get("/api/salas", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM sala");
    res.json(rows);
  } catch (err) {
    console.error("Error listando salas:", err);
    res.status(500).json({ message: "Error obteniendo salas" });
  }
});

// Entrar a sala
app.post("/api/salas/entrar", async (req, res) => {
  const { sala_id, usuario_id, password } = req.body;

  try {
    const [salas] = await pool.query("SELECT * FROM sala WHERE id = ?", [
      sala_id,
    ]);

    if (salas.length === 0)
      return res.status(404).json({ message: "Sala no existe" });

    const sala = salas[0];

    // Validar privada
    if (sala.es_privada && sala.password !== password) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // Validar capacidad
    const [count] = await pool.query(
      "SELECT COUNT(*) AS total FROM sala_usuario WHERE sala_id = ?",
      [sala_id]
    );

    if (count[0].total >= sala.max_usuarios)
      return res.status(400).json({ message: "Sala llena" });

    // Registrar ingreso
    await pool.query(
      "INSERT INTO sala_usuario (sala_id, usuario_id) VALUES (?, ?)",
      [sala_id, usuario_id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Error entrando a sala:", err);
    res.status(500).json({ message: "Error entrando a sala" });
  }
});

// Eliminar sala (solo creador)
app.delete("/api/salas/:id", async (req, res) => {
  const sala_id = req.params.id;
  const { usuario_id } = req.body;

  try {
    const [rows] = await pool.query("SELECT * FROM sala WHERE id = ?", [
      sala_id,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Sala no existe" });

    const sala = rows[0];

    if (sala.creador_id !== usuario_id)
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar esta sala" });

    await pool.query("DELETE FROM sala WHERE id = ?", [sala_id]);
    await pool.query("DELETE FROM sala_usuario WHERE sala_id = ?", [sala_id]);

    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando sala:", err);
    res.status(500).json({ message: "Error eliminando sala" });
  }
});

// ───────────────────────────────────────────
// SOCKET.IO
// ───────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Nuevo socket:", socket.id);

  socket.on("setUser", (username) => {
    socket.data.username = username;
  });

  // CHAT GLOBAL
  socket.on("message", (body) => {
    const msg = {
      body,
      from: socket.data.username,
      createdAt: new Date().toISOString(),
    };

    socket.broadcast.emit("message", msg);
  });

  // Unirse a sala
  socket.on("joinRoom", (roomId) => {
    socket.join(`room_${roomId}`);
  });

  // Mensajes dentro de sala
  socket.on("messageRoom", ({ roomId, body }) => {
    const msg = {
      body,
      from: socket.data.username, // 👈 SIEMPRE EL USUARIO CORRECTO
      createdAt: new Date().toISOString(),
    };

    io.to(`room_${roomId}`).emit("messageRoom", msg);
  });

  // Desconectar usuario → libera login
  socket.on("disconnect", () => {
    if (socket.data.username) {
      usuariosConectados.delete(socket.data.username);
      console.log("Usuario desconectado:", socket.data.username);
    }
  });
});



// Servir frontend compilado (Vite /dist)
app.use(express.static(resolve("frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(resolve("frontend/dist/index.html"));
});




// Start Server
server.listen(PORT);
console.log(`server on port ${PORT}`);
