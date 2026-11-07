import { createContext, useCallback, useContext, useState } from "react";

const Ctx = createContext(null);
let contador = 0;

export function AvisosProvider({ children }) {
  const [lista, setLista] = useState([]);

  const avisar = useCallback((texto, tipo = "ok") => {
    const id = ++contador;
    setLista((l) => [...l, { id, texto, tipo }]);
    setTimeout(() => setLista((l) => l.filter((a) => a.id !== id)), tipo === "erro" ? 8000 : 5000);
  }, []);

  return (
    <Ctx.Provider value={{ avisar }}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {lista.map((a) => (
          <div key={a.id} className={`aviso ${a.tipo}`}>{a.texto}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useAvisos = () => useContext(Ctx);
