import { useState } from "react";
import { createSala } from "../api";

export default function SalaCreate({ userId, setPantalla }) {
  const [titulo, setTitulo] = useState("");
  const [maxUsuarios, setMaxUsuarios] = useState(5);
  const [privada, setPrivada] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const usuariosOpciones = Array.from({ length: 10 }, (_, i) => i + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!titulo.trim()) {
      return setError("El título no puede estar vacío");
    }

    if (privada && !password.trim()) {
      return setError("Debe ingresar una contraseña para la sala privada");
    }

    const data = await createSala({
      titulo,
      max_usuarios: Number(maxUsuarios), // ← MUY IMPORTANTE
      es_privada: privada ? 1 : 0,
      password: privada ? password : null,
      creador_id: userId,
    });

    if (data.ok) {
      alert("Sala creada correctamente");
      setPantalla("salas");
    } else {
      setError("No se pudo crear la sala");
    }
  };

  return (
    <div className="p-6 text-white h-screen bg-zinc-900">
      <h1 className="text-2xl font-bold mb-3">Crear Sala</h1>
      <p className="text-sm text-zinc-400 mb-5">
        Complete el formulario para crear una sala privada o pública
      </p>

      {error && (
        <p className="text-red-400 bg-red-900/30 p-2 rounded mb-3">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block text-sm mb-1">Título de la sala</label>
          <input
            type="text"
            className="w-full p-2 rounded bg-zinc-800 border border-zinc-600"
            onChange={(e) => setTitulo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Máximo de usuarios</label>
          <select
            className="w-full p-2 rounded bg-zinc-800 border border-zinc-600"
            onChange={(e) => setMaxUsuarios(Number(e.target.value))}
          >
            {usuariosOpciones.map((n) => (
              <option key={n} value={n}>
                {n} usuario{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              onChange={(e) => setPrivada(e.target.checked)}
            />
            Sala privada
          </label>
        </div>

        {privada && (
          <div>
            <label className="block text-sm mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-zinc-800 border border-zinc-600"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        <button className="w-full p-2 bg-green-600 hover:bg-green-500 rounded">
          Crear sala
        </button>
      </form>

      <button
        onClick={() => setPantalla("salas")}
        className="w-full mt-4 p-2 bg-zinc-700 hover:bg-zinc-600 rounded"
      >
        Volver
      </button>
    </div>
  );
}
