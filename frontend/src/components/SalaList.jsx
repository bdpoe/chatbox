import { useEffect, useState } from "react";
import { getSalas, entrarSala, eliminarSalaAPI } from "../api";

export default function SalaList({
  userId,
  username,
  setPantalla,
  setSalaSeleccionada,
}) {
  const [salas, setSalas] = useState([]);
  const [passwords, setPasswords] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    cargarSalas();
  }, []);

  const cargarSalas = async () => {
    const data = await getSalas();
    setSalas(data);
  };

  const handleEntrar = async (sala) => {
    setError("");

    const data = await entrarSala({
      sala_id: sala.id,
      usuario_id: userId,
      password: sala.es_privada ? passwords[sala.id] || "" : null,
    });

    if (!data.ok) {
      setError(data.message);
      return;
    }

    // PASA LA SALA COMPLETA A SalaChat
    setSalaSeleccionada({
      id: sala.id,
      creador: sala.creador_id,
      titulo: sala.titulo,
    });

    setPantalla("salaChat");
  };

  const handleEliminar = async (id) => {
    const data = await eliminarSalaAPI(id, userId);

    if (!data.ok) {
      alert(data.message);
      return;
    }

    cargarSalas();
  };

  return (
    <div className="p-5 text-white min-h-screen bg-zinc-900">
      <h2 className="text-xl font-bold mb-4">Salas Disponibles</h2>

      {error && (
        <p className="text-red-400 mb-3 bg-red-900/40 px-3 py-2 rounded-lg border border-red-600">
          {error}
        </p>
      )}

      <ul className="space-y-4">
        {salas.map((sala) => (
          <li key={sala.id} className="bg-zinc-800 p-4 rounded-lg shadow-xl border border-zinc-700">
            <h3 className="text-lg font-bold">{sala.titulo}</h3>

            <p className="text-xs text-zinc-400">
              Máx: {sala.max_usuarios} usuarios
            </p>

            <p className="text-xs text-zinc-400">
              {sala.es_privada ? "Privada 🔒" : "Pública 🔓"}
            </p>

            {/* INPUT DE CONTRASEÑA CORREGIDO */}
            {sala.es_privada && (
              <input
                type="password"
                placeholder="Contraseña"
                autoComplete="current-password"
                className="mt-2 w-full px-3 py-2 text-black rounded-lg border border-gray-400"
                value={passwords[sala.id] || ""}
                onChange={(e) =>
                  setPasswords((prev) => ({
                    ...prev,
                    [sala.id]: e.target.value,
                  }))
                }
              />
            )}

            <button
              onClick={() => handleEntrar(sala)}
              className="mt-3 w-full bg-sky-600 hover:bg-sky-500 p-2 rounded-lg text-sm font-semibold"
            >
              Entrar
            </button>

            {/* BOTÓN PARA ELIMINAR SALA — SOLO EL CREADOR */}
            {sala.creador_id === userId && (
              <button
                onClick={() => handleEliminar(sala.id)}
                className="mt-2 w-full bg-red-600 hover:bg-red-500 p-2 rounded-lg text-sm font-semibold"
              >
                Eliminar sala
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        onClick={() => setPantalla("crearSala")}
        className="mt-6 w-full bg-green-600 hover:bg-green-500 p-2 rounded-lg"
      >
        Crear nueva sala
      </button>

      <button
        onClick={() => setPantalla("chatGlobal")}
        className="mt-3 w-full bg-zinc-700 hover:bg-zinc-600 p-2 rounded-lg"
      >
        Volver al chat global
      </button>
    </div>
  );
}
