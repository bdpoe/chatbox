import { useEffect, useState } from "react";
import io from "socket.io-client";

import SalaList from "./components/SalaList";
import SalaCreate from "./components/SalaCreate";
import SalaChat from "./components/SalaChat";

const socket = io("http://localhost:3000");

export default function App() {
  // Estados de login
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");

  // Estados chat global
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // Estados de salas
  const [pantalla, setPantalla] = useState("chatGlobal"); // chatGlobal, salas, crearSala, salaChat
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);

  // Recepción de mensajes globales
  useEffect(() => {
    socket.on("message", (msg) => setMessages((prev) => [...prev, msg]));
    return () => socket.off("message");
  }, []);

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      setLoggedIn(true);
      setUsername(data.username);
      setUserId(data.userId);
      socket.emit("setUser", data.username);
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  };

  // Enviar mensaje CHAT GLOBAL
  const handleSubmitMessage = (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    const msg = {
      body: message,
      from: username,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, msg]);
    setMessage("");
    socket.emit("message", msg.body);
  };

  // 🧾 PANTALLA LOGIN
  if (!loggedIn) {
    return (
      <div className="h-screen bg-zinc-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-zinc-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-xl font-bold text-white text-center mb-2">
            Iniciar sesión
          </h1>

          {error && (
            <p className="text-red-400 text-sm text-center mb-3">{error}</p>
          )}

          <form onSubmit={handleLogin} className="space-y-3 text-white">
            <div>
              <label className="text-sm">Usuario</label>
              <input
                type="text"
                className="w-full p-2 rounded bg-zinc-700 text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm">Password</label>
              <input
                type="password"
                className="w-full p-2 rounded bg-zinc-700 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="w-full bg-sky-600 hover:bg-sky-500 p-2 rounded">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────
  // 🟦 LÓGICA DE PANTALLAS
  // ───────────────────────────────────────────────

  if (pantalla === "salas") {
    return (
      <SalaList
        userId={userId}
        username={username}
        setPantalla={setPantalla}
        setSalaSeleccionada={setSalaSeleccionada}
      />
    );
  }

  if (pantalla === "crearSala") {
    return <SalaCreate userId={userId} setPantalla={setPantalla} />;
  }
  if (pantalla === "salaChat") {
    return (
      <SalaChat
        salaSeleccionada={salaSeleccionada} // ✔ NOMBRE CORRECTO
        username={username}
        setPantalla={setPantalla}
      />
    );
  }

  // ───────────────────────────────────────────────
  // 🟩 CHAT GLOBAL (pantalla por defecto)
  // ───────────────────────────────────────────────

  return (
    <div className="h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-zinc-500/90 rounded-2xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-5 py-4 border-b border-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wide">CHAT GLOBAL</h1>
            <p className="text-xs text-zinc-300">
              Logueado como <span className="text-red-400">{username}</span>
            </p>
          </div>

          {/* Botón para ir a salas */}
          <div className="p-3">
            <div
              onClick={() => setPantalla("salas")}
              className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 shadow-md"
            >
              <h2 className="text-white text-lg font-bold">Salas</h2>
              <p className="text-xs text-zinc-400">Ver salas disponibles</p>
            </div>
          </div>
        </header>

        {/* Lista de mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-900/70">
          {messages.map((msg, index) => {
            const isMe = msg.from === username;

            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-xl max-w-[70%] ${
                    isMe ? "bg-sky-600 text-white" : "bg-zinc-800 text-white"
                  }`}
                >
                  <strong>{msg.from}: </strong>
                  {msg.body}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input mensaje */}
        <form
          onSubmit={handleSubmitMessage}
          className="p-4 bg-zinc-900 flex gap-2 border-t border-zinc-800"
        >
          <input
            type="text"
            value={message}
            placeholder="Escribe un mensaje..."
            className="flex-1 p-2 rounded bg-zinc-800 text-white"
            onChange={(e) => setMessage(e.target.value)}
          />

          <button className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded">
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
