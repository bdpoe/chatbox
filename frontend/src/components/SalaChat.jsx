import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

export default function SalaChat({ salaSeleccionada, username, setPantalla }) {
  // ⚠️ Si NO hay sala seleccionada → mostrar mensaje
  if (!salaSeleccionada) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-900 text-white">
        <p className="text-lg mb-4 flex items-center gap-2">
          ❌ No se ha seleccionado ninguna sala
        </p>
        <button
          onClick={() => setPantalla("salas")}
          className="bg-sky-600 px-4 py-2 rounded-lg"
        >
          Volver a salas
        </button>
      </div>
    );
  }

  // Datos de la sala
  const { id: salaId, titulo, creador } = salaSeleccionada;

  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");

  const chatRef = useRef();

  // 🔽 Auto-scroll siempre al final
  const scrollBottom = () => {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 50);
  };

  // 📡 Socket: recibir mensajes
  useEffect(() => {
    socket.emit("joinRoom", salaId);

    socket.on("messageRoom", (message) => {
      // ❌ Evitar duplicados del mismo usuario
      if (message.from === username) return;

      setMessages((prev) => [...prev, message]);
      scrollBottom();
    });

    return () => {
      socket.off("messageRoom");
    };
  }, [salaId]);

  // ✉️ Enviar mensaje
  const enviar = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;

    // Mensaje local (instantáneo)
    const myMessage = {
      body: msg,
      from: username,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, myMessage]);
    scrollBottom();

    // Enviar al servidor
    socket.emit("messageRoom", {
      roomId: salaId,
      body: msg,
      from: username,
    });

    setMsg("");
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white">
      {/* CABECERA */}
      <div className="p-4 bg-zinc-800 border-b border-zinc-700 shadow">
        <h2 className="text-xl font-bold">{titulo}</h2>
        <p className="text-xs text-zinc-400">
          Sala #{salaId} {creador ? `• Creador: ${creador}` : ""}
        </p>
      </div>

      {/* MENSAJES */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-900"
      >
        {messages.map((m, index) => {
          const isMe = m.from === username;

          return (
            <div
              key={index}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-3 py-2 rounded-lg shadow 
                ${
                  isMe
                    ? "bg-sky-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                }`}
              >
                <div className="text-xs font-semibold mb-1 opacity-80">
                  {m.from}:
                </div>

                <div className="text-sm">{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT MENSAJE */}
      <form
        onSubmit={enviar}
        className="p-4 bg-zinc-800 border-t border-zinc-700 flex gap-2"
      >
        <input
          className="flex-1 p-2 rounded bg-zinc-700 text-white border border-zinc-600"
          placeholder="Escribe un mensaje..."
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />

        <button className="bg-sky-600 px-4 py-2 rounded-lg font-semibold hover:bg-sky-500">
          Enviar
        </button>
      </form>

      <button
        onClick={() => setPantalla("salas")}
        className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 text-center"
      >
        Volver a salas
      </button>
    </div>
  );
}
