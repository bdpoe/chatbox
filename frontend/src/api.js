const API_URL = "http://localhost:3000";

// ─────────────────────────────
// LOGIN
// ─────────────────────────────
export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  return res.json();
}

// ─────────────────────────────
// LISTAR SALAS
// ─────────────────────────────
export async function getSalas() {
  const res = await fetch(`${API_URL}/api/salas`);
  return res.json();
}

// ─────────────────────────────
// CREAR SALA
// ─────────────────────────────
export async function createSala(data) {
  const res = await fetch(`${API_URL}/api/salas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}

// ─────────────────────────────
// ENTRAR A SALA
// ─────────────────────────────
export async function entrarSala(data) {
  const res = await fetch(`${API_URL}/api/salas/entrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return res.json();
}

// ─────────────────────────────
// ELIMINAR SALA (SOLO CREADOR)
// ─────────────────────────────
export async function eliminarSalaAPI(sala_id, usuario_id) {
  const res = await fetch(`${API_URL}/api/salas/${sala_id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario_id }),
  });

  return res.json();
}
